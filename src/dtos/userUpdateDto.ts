import {
  IsDefined,
  IsEmail,
  Matches,
  IsOptional,
  IsString,
  IsPhoneNumber,
  Min
} from "class-validator";

/**
 * A dto used for a user update request.
 */
export default class UserUpdateDto {
  /**
   * The user's email address.
   */
  @IsDefined()
  @IsEmail()
  email: string;

  /**
   * The user's username.
   */
  @IsDefined()
  @Matches(/^[a-zA-Z0-9_-]{2,20}$/)
  username: string;

  /**
   * The user's phone number. Includes international prefix (e.g. +41, +972).
   */
  @IsOptional()
  @IsString()
  @IsPhoneNumber(null)
  phoneNumber?: string;

  /**
   * The amount of seconds from the last time the user was notified to avoid notifying them. If 0 then the user has no limit.
   */
  @IsDefined()
  @Min(0)
  alertLimit: number;
}
