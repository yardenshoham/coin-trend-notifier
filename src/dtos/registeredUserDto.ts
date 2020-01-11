import UserDto from "./userDto";
import { IsMongoId } from "class-validator";

/**
 * A User data transfer object. Used for sending registered user objects.
 */
export default class RegisteredUserDto extends UserDto {
  /**
   * The user's id in the database.
   */
  @IsMongoId()
  _id: string;
}
