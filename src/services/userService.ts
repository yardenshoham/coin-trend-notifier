import { User, userDbPromise } from "../models/user";
import UserDtoIn from "../dtos/userDtoIn";
import RegisteredUserDto from "../dtos/registeredUserDto";
import UserAlreadyExistsError from "../errors/userAlreadyExistsError";
import bcrypt from "bcrypt";
import { validateOrReject } from "class-validator";
import _ from "lodash";

/**
 * A service to perform various related user methods.
 */
export default class UserService {
  /**
   * Sign up a given user to the system.
   * @param userProperties The properties of the user to add/sign up.
   * @throws [[UserAlreadyExistsError]] If the provided email is already in the system.
   * @throws [ValidationError](https://github.com/typestack/class-validator#validation-errors)[] If one or more properties were not valid.
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
}
