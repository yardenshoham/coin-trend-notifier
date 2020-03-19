import {
  JsonController,
  Post,
  Body,
  Res,
  Put,
  Req,
  HttpCode,
  UseBefore,
  Patch,
  Get
} from "routing-controllers";
import UserDtoIn from "../dtos/userDtoIn";
import UserService from "./../services/userService";
import { Response } from "express";
import UserAlreadyExistsError from "./../errors/userAlreadyExistsError";
import {
  UNPROCESSABLE_ENTITY,
  UNAUTHORIZED,
  OK,
  NO_CONTENT,
  CONFLICT,
  BAD_REQUEST
} from "http-status-codes";
import { ValidationError } from "class-validator";
import UserLoginDto from "../dtos/userLoginDto";
import { OpenAPI, ResponseSchema } from "routing-controllers-openapi";
import RegisteredUserDto from "../dtos/registeredUserDto";
import ChangePasswordDto from "./../dtos/changePasswordDto";
import AuthorizedRequest from "./../interfaces/authorizedRequest";
import AuthMiddleware from "./../middleware/authMiddleware";
import UserUpdateDto from "./../dtos/userUpdateDto";

/**
 * Controller for users.
 */
@JsonController("/users")
export default class UserController {
  /**
   * Registers a user to the system.
   * @param userProperties The request body.
   * @returns One of the following:
   *  - A [[RegisteredUserDto]] object if registration went well. Status: OK.
   *  - A { error: string } object if the user already exists. Status: UNPROCESSABLE_ENTITY.
   *  - A [ValidationError](https://github.com/typestack/class-validator#validation-errors)[] if one or more properties were not valid. Status: UNPROCESSABLE_ENTITY.
   */
  @OpenAPI({
    description: "Register a user",
    requestBody: {
      content: {
        "application/json": {
          example: {
            email: "test.me@gmail.com",
            password: "12345678",
            username: "test_user",
            phoneNumber: "+972-523546888",
            alertLimit: 0
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
          "An error occurred. Either the user already exists or one or more properties were not valid."
      },
      [OK]: {
        content: {
          "application/json": {
            example: {
              email: "test.me@gmail.com",
              username: "test_user",
              alertLimit: 0,
              phoneNumber: "+972-523546888",
              _id: "5e19bb04bed2e852c07554e4"
            }
          }
        }
      }
    }
  })
  @ResponseSchema(RegisteredUserDto, {
    description: "The user successfully registered."
  })
  @Post()
  public async signUp(
    @Body({ required: true, validate: false }) userProperties: UserDtoIn,
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
  @OpenAPI({
    description: "Login a user",
    requestBody: {
      description:
        "The credentials (email and password) of the user that wants to login.",
      content: {
        "application/json": {
          example: {
            email: "test.user@testdomain.com",
            password: "123456789"
          }
        }
      }
    },
    responses: {
      [UNAUTHORIZED]: {
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
        description:
          "The user is not registered or an incorrect password was provided."
      },
      [OK]: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                jwt: {
                  type: "string"
                }
              },
              required: ["jwt"]
            },
            example: {
              jwt:
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZTE5YjhlZmJlZDJlODUyYzA3NTU0ZTMiLCJpYXQiOjE1Nzg3NDQwNTZ9.lnf6tlSA1_EGFA23Ks_rOaZ2skd960zr5QeRc5vOonU"
            }
          }
        }
      }
    }
  })
  @Post("/login")
  public async login(
    @Body({ required: true, validate: false }) userCredentials: UserLoginDto,
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

  /**
   * Changes a user's password.
   * @param passwords The user's old and new password.
   * @param req The Express request + jwt payload.
   * @param res The Express response.
   */
  @OpenAPI({
    security: [{ bearerAuth: [] }],
    description: "Change a user's password.",
    requestBody: {
      content: {
        "application/json": {
          example: {
            oldPassword: "12345678",
            newPassword: "123456789"
          }
        }
      }
    },
    responses: {
      "400": {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: {
                  type: "string"
                },
                message: {
                  type: "string"
                },
                errors: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      target: {
                        type: ChangePasswordDto
                      },
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
                        type: "array"
                      }
                    },
                    required: ["property", "value"]
                  }
                }
              }
            }
          }
        },
        description: "Validation Error."
      },
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
        description:
          "An error occurred. Either the user does not exist or password was not correct/invalid."
      }
    }
  })
  @HttpCode(NO_CONTENT)
  @UseBefore(AuthMiddleware)
  @Patch("/password")
  public async changePassword(
    @Body({ required: true }) passwords: ChangePasswordDto,
    @Req() req: AuthorizedRequest,
    @Res() res: Response
  ): Promise<Response> {
    try {
      await UserService.changePassword(
        req.jwtPayload._id,
        passwords.oldPassword,
        passwords.newPassword
      );
      return res.status(NO_CONTENT).send();
    } catch (error) {
      return res.status(UNPROCESSABLE_ENTITY).send({ error: error.message });
    }
  }

  /**
   * Updates a user's properties.
   * @param updateProperties The new user properties.
   * @param req The Express request + jwt payload.
   * @param res The Express response.
   * @returns the updated user (status 200) or, if an error occurred a { error: string } object (status 409).
   */
  @OpenAPI({
    security: [{ bearerAuth: [] }],
    description: "Update a user's properties.",
    requestBody: {
      content: {
        "application/json": {
          example: {
            email: "test.me@gmail.com",
            username: "test_user",
            phoneNumber: "+972-523546888",
            alertLimit: 604800
          }
        }
      }
    },
    responses: {
      "400": {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: {
                  type: "string"
                },
                message: {
                  type: "string"
                },
                errors: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      target: {
                        type: UserUpdateDto
                      },
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
                        type: "array"
                      }
                    },
                    required: ["property", "value"]
                  }
                }
              }
            }
          }
        },
        description: "Validation Error."
      },
      "409": {
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
        description:
          "Either the user does not exist or the given email was taken."
      },
      [OK]: {
        content: {
          "application/json": {
            example: {
              _id: "5e19bb04bed2e852c07554e4",
              email: "test.me@gmail.com",
              username: "test_user",
              phoneNumber: "+972-523546888",
              alertLimit: 604800
            }
          }
        }
      }
    }
  })
  @UseBefore(AuthMiddleware)
  @Put()
  public async updateUser(
    @Body({ required: true }) updateProperties: UserUpdateDto,
    @Req() req: AuthorizedRequest,
    @Res() res: Response
  ) {
    try {
      return res.send(
        await UserService.updateUser(req.jwtPayload._id, updateProperties)
      );
    } catch (error) {
      return res.status(CONFLICT).send({ error: error.message });
    }
  }

  /**
   * Gets information about the current user.
   * @param req The Express request + jwt payload.
   * @param res The Express response.
   * @returns One of the following:
   *  - A [[RegisteredUserDto]] object if registration went well. Status: OK.
   *  - A { error: string } object if the user does not exist. Status: BAD_REQUEST.
   */
  @OpenAPI({
    security: [{ bearerAuth: [] }],
    description: "Get information about the current user",
    responses: {
      [BAD_REQUEST]: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "string"
                }
              }
            },
            example: { error: "The user hasn't registered." }
          }
        },
        description: "An error occurred. The user does not exist."
      },
      [OK]: {
        content: {
          "application/json": {
            example: {
              email: "test.me@gmail.com",
              username: "test_user",
              alertLimit: 0,
              phoneNumber: "+972-523546888",
              _id: "5e19bb04bed2e852c07554e4"
            }
          }
        }
      }
    }
  })
  @UseBefore(AuthMiddleware)
  @ResponseSchema(RegisteredUserDto, {
    description: "The user was successfully identified."
  })
  @Get()
  public async getById(
    @Req() req: AuthorizedRequest,
    @Res() res: Response
  ): Promise<Response> {
    try {
      return res.send(
        await UserService.getRegisteredDtoById(req.jwtPayload._id)
      );
    } catch (error) {
      return res.status(BAD_REQUEST).send({ error: error.message });
    }
  }
}
