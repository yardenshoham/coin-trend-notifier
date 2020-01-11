import {
  JsonController,
  Res,
  Req,
  UseBefore,
  QueryParams,
  Get
} from "routing-controllers";
import { Response } from "express";
import { BAD_REQUEST } from "http-status-codes";
import AuthorizedRequest from "./../interfaces/authorizedRequest";
import AuthMiddleware from "./../middleware/authMiddleware";
import EventService from "../services/eventService";

/**
 * Controller for events.
 */
@JsonController("/events")
export default class EventController {
  /**
   * Returns a specified amount of the most recent events of a given user.
   * @param params The query parameters, either empty or a positive number.
   * @param req The Express request + jwt payload.
   * @param res The Express response.
   */
  @UseBefore(AuthMiddleware)
  @Get()
  public async getEvents(
    @QueryParams() params: { amount?: string },
    @Req() req: AuthorizedRequest,
    @Res() res: Response
  ): Promise<Response> {
    try {
      return res.send(
        await EventService.getEvents(
          req.jwtPayload._id,
          parseInt(params.amount)
        )
      );
    } catch (error) {
      return res.status(BAD_REQUEST).send({ error: error.message });
    }
  }
}
