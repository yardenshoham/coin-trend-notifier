/**
 * A User data transfer object. Used for login with an email and a password.
 */
export default interface UserLoginDto {
  /**
   * The user's email address.
   */
  email: string;

  /**
   * The user's password.
   */
  password: string;
}
