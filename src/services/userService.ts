import { User, userDbPromise } from "../models/user";
import UserDtoIn from "../dtos/userDtoIn";
import RegisteredUserDto from "../dtos/registeredUserDto";
import UserAlreadyExistsError from "../errors/userAlreadyExistsError";
import bcrypt from "bcrypt";
import { validateOrReject } from "class-validator";
import _ from "lodash";
import jwt from "jsonwebtoken";
import UserDoesNotExistError from "./../errors/userDoesNotExistError";
import UserLoginDto from "../dtos/userLoginDto";
import WrongPasswordError from "./../errors/wrongPasswordError";
import UserJwtPayload from "../interfaces/userJwtPayload";
import config from "config";
import { ObjectId } from "mongodb";
import UserUpdateDto from "../dtos/userUpdateDto";

/**
 * A service to perform various user related methods.
 */
export default class UserService {
  /**
   * Sign up a given user to the system.
   * @param userProperties The properties of the user to add/sign up.
   * @throws [[UserAlreadyExistsError]] If the provided email is already in the system.
   * @throws [ValidationError](https://github.com/typestack/class-validator#validation-errors)[] If one or more properties were not valid.
   * @returns The registered user.
   */
  public static async signUp(
    userProperties: UserDtoIn
  ): Promise<RegisteredUserDto> {
    const userDb = await userDbPromise;
    const found = await userDb.findOne({ email: userProperties.email });

    // if the email is already taken
    if (found) {
      throw new UserAlreadyExistsError(userProperties.email);
    }

    // hash password
    const hashedPassword = await bcrypt.hash(userProperties.password, 10);

    // create user
    const newUser = new User(
      userProperties.email,
      userProperties.username,
      hashedPassword,
      userProperties.phoneNumber,
      userProperties.alertLimit
    );

    // validate user
    await validateOrReject(newUser, { validationError: { target: false } });

    // save in db
    await userDb.insert(newUser);

    // return the new user without the password.
    const createdUser = _.omit(newUser, "_password");
    ((createdUser as unknown) as RegisteredUserDto)._id = createdUser._id.toHexString();
    return (createdUser as unknown) as RegisteredUserDto;
  }

  /**
   * Given an email and a password, signs in/logins the user.
   * @param userCredentials The credentials (email and password) of the user that wants to login.
   * @throws [[UserDoesNotExistError]] If the provided email wasn't found in the system.
   * @throws [[WrongPasswordError]] If the provided password does not match the user's password.
   * @returns The [json web token](https://en.wikipedia.org/wiki/JSON_Web_Token) with the payload [[UserJwtPayload]].
   */
  public static async login(userCredentials: UserLoginDto): Promise<string> {
    // find user
    const userDb = await userDbPromise;
    const user = await userDb.findOne({ email: userCredentials.email });

    // check if user exists
    if (!user) {
      throw new UserDoesNotExistError(userCredentials.email);
    }

    // compare passwords
    if (!(await bcrypt.compare(userCredentials.password, user.password))) {
      throw new WrongPasswordError();
    }

    // create and return jwt
    const payload: UserJwtPayload = { _id: user._id.toHexString() };
    return jwt.sign(payload, config.get("jwtPrivateKey"));
  }

  /**
   * Given a user's id, either returns the associated user, or throws a [[UserDoesNotExistError]].
   * @param id The user's id string.
   * @throws [[UserDoesNotExistError]] If the provided id wasn't found in the system.
   * @returns The user object.
   */
  public static async getById(id: string): Promise<User> {
    let objectId: ObjectId;
    try {
      objectId = ObjectId.createFromHexString(id);
    } catch {
      throw new UserDoesNotExistError();
    }
    const user = await (await userDbPromise).findById(objectId);
    if (!user) {
      throw new UserDoesNotExistError();
    }
    return user;
  }

  /**
   * Given a user's id, either returns the associated user's dto, or throws a [[UserDoesNotExistError]].
   * @param id The user's id string.
   * @throws [[UserDoesNotExistError]] If the provided id wasn't found in the system.
   * @returns The user object.
   */
  public static async getRegisteredDtoById(
    id: string
  ): Promise<RegisteredUserDto> {
    const user = await this.getById(id);

    // return the user without the password.
    const dto = _.omit(user, "_password");
    ((dto as unknown) as RegisteredUserDto)._id = dto._id.toHexString();
    return (dto as unknown) as RegisteredUserDto;
  }

  /**
   * Given an id, old password and new password, changes the password of user that has this [[id]].
   * @param id The hex string of the user's id.
   * @param oldPassword The user's current password.
   * @param newPassword The user's new password.
   */
  public static async changePassword(
    id: string,
    oldPassword: string,
    newPassword: string
  ) {
    const user = await this.getById(id);

    if (!(await bcrypt.compare(oldPassword, user.password))) {
      throw new WrongPasswordError();
    }

    user.password = await bcrypt.hash(newPassword, 10);

    return (await userDbPromise).update(user);
  }

  /**
   * Updates a user's properties.
   * @param userId The id of the user to update.
   * @param userUpdateProperties The new properties of the user.
   * @throws [[UserDoesNotExistError]] If the given user id is invalid.
   * @throws [[UserAlreadyExistsError]] If the given user email is taken.
   */
  public static async updateUser(
    userId: string,
    userUpdateProperties: UserUpdateDto
  ): Promise<RegisteredUserDto> {
    const userDb = await userDbPromise;
    const user = await this.getById(userId);

    if (user.email != userUpdateProperties.email) {
      const found = await userDb.findOne({ email: userUpdateProperties.email });

      // if the email is already taken
      if (found) {
        throw new UserAlreadyExistsError(userUpdateProperties.email);
      }
    }

    // update
    for (const key in userUpdateProperties) {
      if (userUpdateProperties.hasOwnProperty(key)) {
        const element = userUpdateProperties[key];
        if (element != undefined && element != null) user[key] = element;
      }
    }
    await userDb.update(user);

    const dto = _.omit(user, "_password");
    ((dto as unknown) as RegisteredUserDto)._id = dto._id.toHexString();
    return (dto as unknown) as RegisteredUserDto;
  }
}
