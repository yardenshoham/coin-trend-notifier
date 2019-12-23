import UserDto from "./userDto";

/**
 * A User data transfer object. Used for sending a user object from the client.
 */
export default interface UserDtoIn extends UserDto {
  /**
   * The user's password.
   */
  password: string;
}
