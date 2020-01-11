import UserDto from "./userDto";
import { IsDefined, MinLength, IsString } from "class-validator";

/**
 * A User data transfer object. Used for sending a user object from the client.
 */
export default class UserDtoIn extends UserDto {
  /**
   * The user's password.
   */
  @IsDefined()
  @MinLength(6)
  @IsString()
  password: string;
}
