/**
 * Thrown when there is an attempt to login but the password doesn't match.
 */
export default class WrongPasswordError extends Error {
  constructor() {
    super("Incorrect password.");
    Object.setPrototypeOf(this, WrongPasswordError.prototype);
  }
}
