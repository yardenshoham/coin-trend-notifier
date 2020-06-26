import {
  JsonController,
  Res,
  Req,
  UseBefore,
  Get,
  QueryParam,
  Param,
} from "routing-controllers";
import { Response } from "express";
import { BAD_REQUEST, NOT_FOUND, OK } from "http-status-codes";
import AuthorizedRequest from "../interfaces/authorizedRequest";
import AuthMiddleware from "./../middleware/authMiddleware";
import EventService from "../services/eventService";
import { OpenAPI, ResponseSchema } from "routing-controllers-openapi";
import EventDto from "./../dtos/eventDto";

/**
 * Controller for events.
 */
@JsonController("/events")
export default class EventController {
  /**
   * Returns a specified amount of the most recent events of a given user.
   * @param amount A positive number representing the limit of events to return.
   * @param req The Express request + jwt payload.
   * @param res The Express response.
   * @returns an array of [[EventDto]] if everything went well (status 200), an error if given an invalid user or a negative amount (status 400).
   */
  @OpenAPI({
    security: [{ bearerAuth: [] }],
    description:
      "Retrieve a specified amount of the most recent events of a given user.",
    parameters: [
      {
        in: "query",
        name: "amount",
        description:
          "A positive number representing the limit of events to return.",
      },
    ],
    responses: {
      [OK]: {
        content: {
          "application/json": {
            example: [
              {
                _id: "00000000a26f35468412bb0f",
                probability: 0.25,
                firedAt: 20,
                baseAssetName: "BTC",
                quoteAssetName: "ETH",
              },
              {
                _id: "00000000a26f35468412bb0e",
                probability: 0.2,
                firedAt: 10,
                baseAssetName: "BTC",
                quoteAssetName: "USDT",
              },
            ],
          },
        },
      },
      [BAD_REQUEST]: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "string",
                },
              },
              required: ["error"],
            },
          },
        },
        description: "An error occurred. Invalid user or a negative amount.",
      },
    },
  })
  @ResponseSchema(EventDto, {
    isArray: true,
    description: "Successful response.",
  })
  @UseBefore(AuthMiddleware)
  @Get()
  public async getEvents(
    @Req() req: AuthorizedRequest,
    @Res() res: Response,
    @QueryParam("amount", { validate: false }) amount?: number
  ): Promise<Response> {
    try {
      return res.send(await EventService.getEvents(req.jwtPayload._id, amount));
    } catch (error) {
      return res.status(BAD_REQUEST).send({ error: error.message });
    }
  }

  /**
   * Returns all events.
   * @param req The Express request.
   * @param res The Express response.
   * @returns an array of [[EventDto]] if everything went well (status 200).
   */
  @OpenAPI({
    description: "Retrieve all events.",
    parameters: [
      {
        in: "query",
        name: "amount",
        description:
          "A positive number representing the limit of events to return.",
      },
    ],
    responses: {
      [OK]: {
        content: {
          "application/json": {
            example: [
              {
                _id: "00000000a26f35468412bb0f",
                probability: 0.25,
                firedAt: 20,
                baseAssetName: "BTC",
                quoteAssetName: "ETH",
              },
              {
                _id: "00000000a26f35468412bb0e",
                probability: 0.2,
                firedAt: 10,
                baseAssetName: "BTC",
                quoteAssetName: "USDT",
              },
            ],
          },
        },
      },
    },
  })
  @ResponseSchema(EventDto, {
    isArray: true,
    description: "Successful response.",
  })
  @Get("/analysis")
  public async getAllEvents(@Res() res: Response): Promise<Response> {
    try {
      return res.send(await EventService.getAllEvents());
    } catch (error) {
      return res.status(BAD_REQUEST).send({ error: error.message });
    }
  }

  /**
   * Returns a specific event given its id.
   * @param id The hex string of te event id.
   * @param res The Express response.
   * @returns an [[EventDto]] if everything went well (status 200), an error if the id is invalid (status 404).
   */
  @OpenAPI({
    description: "Retrieve a specific event given its id.",
    responses: {
      [OK]: {
        content: {
          "application/json": {
            example: {
              _id: "00000000a26f35468412bb0f",
              probability: 0.25,
              firedAt: 20,
              baseAssetName: "BTC",
              quoteAssetName: "ETH",
            },
          },
        },
        description: "Successful response.",
      },
      [NOT_FOUND]: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "string",
                },
              },
              required: ["error"],
            },
          },
        },
        description: "An error occurred. The id is invalid.",
      },
    },
  })
  @ResponseSchema(EventDto, { description: "Successful response." })
  @Get("/:id")
  public async getById(
    @Param("id") id: string,
    @Res() res: Response
  ): Promise<Response> {
    try {
      return res.send(await EventService.findEventById(id));
    } catch (error) {
      return res.status(NOT_FOUND).send({ error: error.message });
    }
  }
}
