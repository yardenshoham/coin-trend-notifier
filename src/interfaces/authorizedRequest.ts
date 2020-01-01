import { Request } from "express";
import UserJwtPayload from "./userJwtPayload";

/**
 * An Express request type with a [[UserJwtPayload]].
 */
export default interface AuthorizedRequest extends Request {
  /**
   * The jwt payload of the user that initiated the request.
   */
  jwtPayload: UserJwtPayload;
}
