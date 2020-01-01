/**
 * Thrown when there is an attempt to find a user that has not registered.
 */
export default class UserDoesNotExistError extends Error {
  /**
   * The email that is not in the system.
   */
  public readonly email?: string;

  constructor(email?: string) {
    super("The user hasn't registered.");
    if (email) {
      this.message = `The email ${email} is not registered.`;
      this.email = email;
    }
    Object.setPrototypeOf(this, UserDoesNotExistError.prototype);
  }
}
