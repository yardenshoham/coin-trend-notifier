import { User, userDbPromise } from "../models/user";
import UserDtoIn from "../interfaces/dtos/userDtoIn";
import RegisteredUserDto from "../interfaces/dtos/registeredUserDto";
import UserAlreadyExistsError from "../errors/userAlreadyExistsError";
import bcrypt from "bcrypt";
import { validateOrReject } from "class-validator";
import _ from "lodash";
import jwt from "jsonwebtoken";
import UserDoesNotExistError from "./../errors/userDoesNotExistError";
import UserLoginDto from "../interfaces/dtos/userLoginDto";
import WrongPasswordError from "./../errors/wrongPasswordError";
import UserJwtPayload from "./../interfaces/userJwtPayload";
import config from "config";
import { ObjectId } from "mongodb";

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
      userProperties.phoneNumber
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
}
