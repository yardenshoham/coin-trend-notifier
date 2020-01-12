import UserUpdateDto from "./userUpdateDto";
import { IsOptional, IsPositive } from "class-validator";

/**
 * A general user data transfer object.
 */
export default class UserDto extends UserUpdateDto {
  /**
   * The last time the user was notified. UTC date.
   */
  @IsOptional()
  @IsPositive()
  notifiedAt?: number;
}
