import {
  JsonController,
  Post,
  Body,
  Res,
  Req,
  UseBefore
} from "routing-controllers";
import { Response } from "express";
import UserAlreadyExistsError from "./../errors/userAlreadyExistsError";
import { UNPROCESSABLE_ENTITY, NO_CONTENT } from "http-status-codes";
import { ValidationError } from "class-validator";
import AuthorizedRequest from "./../interfaces/authorizedRequest";
import SetPreferenceDto from "./../interfaces/dtos/setPreferenceDto";
import PreferenceService from "../services/preferenceService";
import AuthMiddleware from "./../middleware/authMiddleware";

/**
 * Controller for preferences.
 */
@UseBefore(AuthMiddleware)
@JsonController("/preferences")
export default class PreferenceController {
  /**
   * Sets a user's wanted probability threshold to be notified about a rise/fall of a symbol.
   * @param preferenceRequest The object containing the symbol information and wanted probability.
   * @param req The Express request + jwt payload.
   * @param res The Express response.
   * @returns One of the following:
   *  - Nothing if everything went well. Status: NO_CONTENT.
   *  - A { error: string } object if the user does not exist or the probability is not between -1 and 1. Status: UNPROCESSABLE_ENTITY.
   *  - A [ValidationError](https://github.com/typestack/class-validator#validation-errors)[] if one or more properties were not valid. Status: UNPROCESSABLE_ENTITY.
   */
  @Post()
  public async setPreference(
    @Body() preferenceRequest: SetPreferenceDto,
    @Req() req: AuthorizedRequest,
    @Res() res: Response
  ): Promise<Response> {
    try {
      await PreferenceService.setPreference(
        req.jwtPayload._id,
        preferenceRequest.baseAssetName,
        preferenceRequest.quoteAssetName,
        preferenceRequest.probability
      );
      return res.status(NO_CONTENT).send();
    } catch (error) {
      let errorToReturn: { error: string } | { errors: ValidationError[] };
      if (
        error instanceof UserAlreadyExistsError ||
        error instanceof RangeError
      ) {
        errorToReturn = { error: error.message };
      } else {
        // ValidationErrors
        errorToReturn = { errors: error };
      }
      return res.status(UNPROCESSABLE_ENTITY).send(errorToReturn);
    }
  }
}
