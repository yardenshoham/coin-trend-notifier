import UserDto from "./userDto";

/**
 * A User data transfer object. Used for sending registered user objects.
 */
export default interface RegisteredUserDto extends UserDto {
  /**
   * The user's id in the database.
   */
  _id: string;
}
