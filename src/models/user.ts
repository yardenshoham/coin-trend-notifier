import { id, Repository } from "mongodb-typescript";
import { ObjectId } from "mongodb";
import { clientPromise } from "../database/client";
import {
  IsEmail,
  Matches,
  IsOptional,
  IsPhoneNumber,
  IsDefined,
  Min
} from "class-validator";

/**
 * A user in the system. A user has an email address and, optionally, a phone number.
 */
export class User {
  /**
   * The id of this document in the database.
   */
  @id
  public _id: ObjectId;

  /**
   * The user's email address.
   */
  @IsDefined()
  @IsEmail()
  public email: string;

  /**
   * The user's username.
   *
   * Min length is 2, max length is 20 and contains letters, numbers, underscores and dashes. Must match the following regular expression: `[a-zA-Z0-9_-]{2, 20}`.
   */
  @IsDefined()
  @Matches(/^[a-zA-Z0-9_-]{2,20}$/)
  public username: string;

  /**
   * The user's password hash. Produced from [bcrypt](https://www.npmjs.com/package/bcrypt).
   */
  @IsDefined()
  @Matches(/^\$2[ayb]\$[\d]{2}\$[./A-Za-z0-9]{53}$/)
  private _password: string;

  /**
   * The amount of seconds from the last time the user was notified to avoid notifying them. If 0 then the user has no limit.
   */
  @IsDefined()
  @Min(0)
  public alertLimit: number;

  /**
   * The last time the user was notified. UTC date.
   */
  public notifiedAt?: number;

  /**
   * The user's phone number. Includes international prefix (e.g. +41, +972).
   */
  @IsOptional()
  @IsPhoneNumber(null)
  public phoneNumber?: string;

  /**
   * Constructs a new user.
   * @param email The user's email address.
   * @param username The user's username.
   * @param password The user's password.
   * @param phoneNumber The user's phone number.
   */
  constructor(
    email: string,
    username: string,
    password: string,
    phoneNumber?: string,
    alertLimit: number = 0
  ) {
    this.email = email;
    this.username = username;
    this.password = password;
    this.alertLimit = alertLimit;
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

/**
 * The context from which one could access all [[User]] documents.
 */
export const userDbPromise = (async function() {
  return new Repository<User>(User, await clientPromise, "users");
})();
