import { IsDefined, MinLength, IsString } from "class-validator";

/**
 * A data transfer object for a password change request.
 */
export default class ChangePasswordDto {
  /**
   * The user's alleged old password.
   */
  @IsDefined()
  @MinLength(6)
  @IsString()
  oldPassword: string;

  /**
   * The user's new password.
   */
  @IsDefined()
  @MinLength(6)
  @IsString()
  newPassword: string;
}
