import { IsDefined, MinLength, IsString, IsEmail } from "class-validator";

/**
 * A User data transfer object. Used for login with an email and a password.
 */
export default class UserLoginDto {
  /**
   * The user's email address.
   */
  @IsDefined()
  @IsEmail()
  email: string;

  /**
   * The user's password.
   */
  @IsDefined()
  @MinLength(6)
  @IsString()
  password: string;
}
