/**
 * A user in the system. A user has an email address and, optionally, a phone number.
 */
export class User {
  /**
   * The user's email address.
   */
  public email: string;

  /**
   * The user's username.
   */
  public username: string;

  /**
   * The user's password.
   */
  private _password: string;

  /**
   * The user's phone number.
   */
  public phoneNumber?: string;

  /**
   * Constructs a new user.
   * @param email The user's email address.
   * @param username The user's username.
   * @param password The user's password.
   * @param phoneNumber The user's phone number.
   */
  constructor(email: string, username: string, password: string, phoneNumber?: string) {
    this.email = email;
    this.username = username;
    this.password = password;
    if (phoneNumber) {
      this.phoneNumber = phoneNumber;
    }
  }

  /**
   * Sets a user's password.
   * @param value The new password.
   */
  public set password(value: string) {
    this._password = value;
  }

  /**
   * Password getter.
   * @returns The user's password.
   */
  public get password(): string {
    return this._password;
  }
}