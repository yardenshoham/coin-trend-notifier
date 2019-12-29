/**
 * A general user data transfer object. Should be extended, not used on its own.
 */
export default interface UserDto {
  /**
   * The user's email address.
   */
  email: string;

  /**
   * The user's username.
   */
  username: string;

  /**
   * The user's phone number. Includes international prefix (e.g. +41, +972).
   */
  phoneNumber?: string;
}
