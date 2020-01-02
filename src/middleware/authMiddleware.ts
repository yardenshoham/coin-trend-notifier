import { ExpressMiddlewareInterface } from "routing-controllers";
import { Response, NextFunction } from "express";
import UserJwtPayload from "./../interfaces/userJwtPayload";
import AuthorizedRequest from "../interfaces/authorizedRequest";
import jwt from "jsonwebtoken";
import config from "config";
import { UNAUTHORIZED, BAD_REQUEST } from "http-status-codes";

/**
 * Decodes the jwt provided by the Authorization Bearer <token> header and assigns it to req.jwtPayload.
 * If the header was not provided it returns an error with an UNAUTHORIZED status.
 * If the header was provided but was not in the shape of Authorization Bearer <token> it returns an error with a BAD_REQUEST status.
 * If the token was provided but was not valid it returns an error with a BAD_REQUEST status.
 *
 * An error is of type { error: string }
 */
export default class AuthMiddleware implements ExpressMiddlewareInterface {
  /**
   * The actual middleware function.
   * @param req The request with an Authorization header.
   * @param res The Express response object.
   * @param next The Express next function.
   */
  use(req: AuthorizedRequest, res: Response, next?: NextFunction) {
    if (!req.headers.authorization) {
      return this.failure(
        res,
        UNAUTHORIZED,
        "Access denied. No token provided."
      );
    }

    const parts = req.headers.authorization.split(" ");

    if (!(parts.length === 2 && parts[0] === "Bearer")) {
      return this.failure(
        res,
        BAD_REQUEST,
        'Authorization header not complying with "Authorization Bearer <token>".'
      );
    }

    try {
      this.success(req, parts[1], next);
    } catch (error) {
      return this.failure(res, BAD_REQUEST, "Invalid token.");
    }
  }

  private success(req: AuthorizedRequest, userJwt: string, next: NextFunction) {
    req.jwtPayload = jwt.verify(
      userJwt,
      config.get("jwtPrivateKey")
    ) as UserJwtPayload;
    next();
  }

  private failure(res: Response, status: number, message: string) {
    return res.status(status).send({ error: message });
  }
}
