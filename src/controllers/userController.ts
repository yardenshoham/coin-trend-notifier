import { JsonController, Post, Body, Res } from "routing-controllers";
import UserDtoIn from "../interfaces/dtos/userDtoIn";
import UserService from "./../services/userService";
import { Response } from "express";
import UserAlreadyExistsError from "./../errors/userAlreadyExistsError";
import { UNPROCESSABLE_ENTITY, UNAUTHORIZED } from "http-status-codes";
import { ValidationError } from "class-validator";
import UserLoginDto from "../interfaces/dtos/userLoginDto";

/**
 * Controller for users.
 */
@JsonController("/users")
export default class UserController {
  /**
   * Registers a user the system.
   * @param userProperties The request body.
   * @returns One of the following:
   *  - A [[RegisteredUser]] object if registration went well. Status: OK.
   *  - A { error: string } object if the user already exists. Status: UNPROCESSABLE_ENTITY.
   *  - A [ValidationError](https://github.com/typestack/class-validator#validation-errors)[] if one or more properties were not valid. Status: UNPROCESSABLE_ENTITY.
   */
  @Post()
  public async signUp(
    @Body() userProperties: UserDtoIn,
    @Res() res: Response
  ): Promise<Response> {
    try {
      return res.send(await UserService.signUp(userProperties));
    } catch (error) {
      let errorToReturn: { error: string } | { errors: ValidationError[] };
      if (error instanceof UserAlreadyExistsError) {
        errorToReturn = { error: error.message };
      } else {
        // ValidationErrors
        errorToReturn = { errors: error };
      }
      return res.status(UNPROCESSABLE_ENTITY).send(errorToReturn);
    }
  }

  /**
   * Logins a user to the system.
   * @param userCredentials The credentials (email and password) of the user that wants to login.
   * @returns One of the following:
   *  - A { jwt: string } object containing the [json web token](https://en.wikipedia.org/wiki/JSON_Web_Token) with the payload [[UserJwtPayload]], used for authentication of all requests. Status: OK.
   *  - A { error: string } object if the user is not registered or an incorrect password was provided. Status: UNAUTHORIZED.
   */
  @Post("/login")
  public async login(
    @Body() userCredentials: UserLoginDto,
    @Res() res: Response
  ): Promise<Response> {
    try {
      return res.send({ jwt: await UserService.login(userCredentials) });
    } catch (error) {
      return res
        .status(UNAUTHORIZED)
        .send({ error: "Invalid email or password." });
    }
  }
}
