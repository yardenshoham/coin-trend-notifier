/**
 * Thrown when there is an attempt to sign up a user with an existing email address.
 */
export default class UserAlreadyExistsError extends Error {
  /**
   * The email that is already in the system.
   */
  public readonly email: string;

  constructor(email: string) {
    super(`The email ${email} is already taken.`);
    this.email = email;
    Object.setPrototypeOf(this, UserAlreadyExistsError.prototype);
  }
}
