import {
  JsonController,
  Post,
  Body,
  Res,
  Req,
  UseBefore,
  Delete,
  QueryParams,
  Get,
  HttpCode
} from "routing-controllers";
import { Response } from "express";
import { UNPROCESSABLE_ENTITY, NO_CONTENT } from "http-status-codes";
import { ValidationError } from "class-validator";
import AuthorizedRequest from "../interfaces/authorizedRequest";
import SetPreferenceDto from "../dtos/setPreferenceDto";
import PreferenceService from "../services/preferenceService";
import AuthMiddleware from "./../middleware/authMiddleware";
import UserDoesNotExistError from "../errors/userDoesNotExistError";
import PreferenceDto from "../dtos/preferenceDto";
import { OpenAPI, ResponseSchema } from "routing-controllers-openapi";

/**
 * Controller for preferences.
 */
@OpenAPI({
  security: [{ bearerAuth: [] }]
})
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
   *  - A [ValidationError](https://github.com/typestack/class-validator#validation-errors)[] if one or more assets were not valid (must be uppercase). Status: UNPROCESSABLE_ENTITY.
   */
  @OpenAPI({
    description:
      "Set a user's wanted probability threshold to be notified about a rise/fall of a symbol.",
    requestBody: {
      content: {
        "application/json": {
          example: {
            baseAssetName: "ETH",
            quoteAssetName: "USDT",
            probability: 0.7
          }
        }
      }
    },
    responses: {
      "422": {
        content: {
          "application/json": {
            schema: {
              oneOf: [
                {
                  type: "object",
                  properties: {
                    error: {
                      type: "string"
                    }
                  },
                  required: ["error"]
                },
                {
                  type: "object",
                  properties: {
                    errors: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          property: {
                            type: "string"
                          },
                          value: {
                            type: "any"
                          },
                          constraints: {
                            type: "object"
                          },
                          children: {
                            type: "object"
                          }
                        },
                        required: ["property", "value"]
                      }
                    }
                  },
                  required: ["errors"]
                }
              ]
            }
          }
        },
        description:
          "An error occurred. Either the user already exists, the probability is not between -1 and 1 or one or more properties were not valid."
      },
      [NO_CONTENT]: {}
    }
  })
  @HttpCode(NO_CONTENT)
  @Post()
  public async setPreference(
    @Body({ validate: false, required: true })
    preferenceRequest: SetPreferenceDto,
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
        error instanceof UserDoesNotExistError ||
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

  /**
   * Removes a user's wanted probability threshold to be notified about a rise/fall of a symbol.
   * @param preferenceRequest The object containing the symbol information.
   * @param req The Express request + jwt payload.
   * @param res The Express response.
   * @returns One of the following:
   *  - Nothing if everything went well. Status: NO_CONTENT.
   *  - A { error: string } object if the user does not exist. Status: UNPROCESSABLE_ENTITY.
   */
  @OpenAPI({
    description:
      "Remove a user's wanted probability threshold to be notified about a rise/fall of a symbol.",
    responses: {
      "422": {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "string"
                }
              },
              required: ["error"]
            }
          }
        },
        description: "An error occurred. The user does not exist."
      }
    }
  })
  @HttpCode(NO_CONTENT)
  @Delete()
  public async deletePreference(
    @QueryParams({ validate: false, required: true })
    preferenceRequest: PreferenceDto,
    @Req() req: AuthorizedRequest,
    @Res() res: Response
  ): Promise<Response> {
    try {
      await PreferenceService.deletePreference(
        req.jwtPayload._id,
        preferenceRequest.baseAssetName,
        preferenceRequest.quoteAssetName
      );
      return res.status(NO_CONTENT).send();
    } catch (error) {
      return res.status(UNPROCESSABLE_ENTITY).send({ error: error.message });
    }
  }

  /**
   * Retrieves all of the given user's preferences.
   * @param req The Express request + jwt payload.
   * @param res The Express response.
   * @returns One of the following:
   *  - A [[SetPreferenceDto]][] if everything went well. Status: OK.
   *  - A { error: string } object if the user does not exist. Status: UNPROCESSABLE_ENTITY.
   */
  @OpenAPI({
    description: "Retrieve all of the given user's preferences.",
    responses: {
      "422": {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "string"
                }
              },
              required: ["error"]
            }
          }
        },
        description: "An error occurred. The user does not exist."
      }
    }
  })
  @ResponseSchema(SetPreferenceDto, { isArray: true })
  @Get()
  public async getPreferences(
    @Req() req: AuthorizedRequest,
    @Res() res: Response
  ) {
    try {
      return res.send(
        await PreferenceService.getPreferences(req.jwtPayload._id)
      );
    } catch (error) {
      return res.status(UNPROCESSABLE_ENTITY).send({ error: error.message });
    }
  }
}
