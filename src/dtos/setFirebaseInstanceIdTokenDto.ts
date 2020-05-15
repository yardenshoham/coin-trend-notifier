import { IsDefined } from "class-validator";

/**
 * A data transfer object for a firebase instance id token update request.
 */
export default class SetFirebaseInstanceIdTokenDto {
  /**
   * The user's new mobile app id.
   */
  @IsDefined()
  token: string;
}
