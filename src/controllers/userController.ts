import { JsonController, Post, Body, Res } from "routing-controllers";
import UserDtoIn from "../interfaces/dtos/userDtoIn";
import UserService from "./../services/userService";
import { Response } from "express";
import UserAlreadyExistsError from "./../errors/userAlreadyExistsError";
import { UNPROCESSABLE_ENTITY } from "http-status-codes";
import { ValidationError } from "class-validator";

/**
 * Controller for users.
 */
@JsonController("/users")
export default class UserController {
  /**
   * Registers a user the system.
   * @param userDetails The request body.
   */
  @Post()
  public async signUp(
    @Body() userProperties: UserDtoIn,
    @Res() response: Response
  ): Promise<Response> {
    try {
      return response.send(await UserService.signUp(userProperties));
    } catch (error) {
      let errorToReturn: { error: string } | { errors: ValidationError[] };
      if (error instanceof UserAlreadyExistsError) {
        errorToReturn = { error: error.message };
      } else {
        // ValidationErrors
        errorToReturn = { errors: error };
      }
      return response.status(UNPROCESSABLE_ENTITY).send(errorToReturn);
    }
  }
}
