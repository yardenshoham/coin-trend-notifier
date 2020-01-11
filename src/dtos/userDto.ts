import {
  IsEmail,
  IsDefined,
  Matches,
  IsOptional,
  IsPhoneNumber,
  Min,
  IsPositive,
  IsString
} from "class-validator";

/**
 * A general user data transfer object. Should be extended, not used on its own.
 */
export default class UserDto {
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

  /**
   * The last time the user was notified. UTC date.
   */
  @IsOptional()
  @IsPositive()
  notifiedAt?: number;
}
