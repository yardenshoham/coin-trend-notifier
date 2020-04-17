import { suite, describe, it } from "mocha";
import chai, { expect } from "chai";
import UserDtoIn from "../../dtos/userDtoIn";
import UserService from "./../../services/userService";
import { userDbPromise } from "../../models/user";
import chaiAsPromised from "chai-as-promised";
import UserAlreadyExistsError from "./../../errors/userAlreadyExistsError";
import { ValidationError } from "class-validator";
import jwt from "jsonwebtoken";
import UserDoesNotExistError from "./../../errors/userDoesNotExistError";
import UserLoginDto from "../../dtos/userLoginDto";
import WrongPasswordError from "../../errors/wrongPasswordError";
import bcrypt from "bcrypt";
import UserUpdateDto from "../../dtos/userUpdateDto";

chai.use(chaiAsPromised);

suite("UserService", function () {
  this.afterEach(async function () {
    const userDb = await userDbPromise;
    return userDb.c.deleteMany({});
  });

  describe("signUp()", function () {
    it("should be given a user and register them", async function () {
      const email = "test.user@test.domain.com";
      const username = "Test_User";

      const user: UserDtoIn = {
        email,
        username,
        password: "123abc",
        phoneNumber: "+972-524444444",
        alertLimit: 0,
      };

      await UserService.signUp(user);

      const userDb = await userDbPromise;
      const userFromDb = await userDb.findOne({ email });

      expect(userFromDb).to.have.property("username", username);
    });

    it("should throw a UserAlreadyExistsError when a user with the same email address as one that already exists tries to sign up", async function () {
      const email = "test.user@test.domain.com";

      const user1: UserDtoIn = {
        email,
        username: "Test_User",
        password: "123abc",
        phoneNumber: "+972-524444444",
        alertLimit: 0,
      };

      const user2: UserDtoIn = {
        email,
        username: "Another-Test-User",
        password: "123456",
        phoneNumber: "+972-52111111",
        alertLimit: 0,
      };

      await UserService.signUp(user1);

      return expect(UserService.signUp(user2)).to.be.rejectedWith(
        UserAlreadyExistsError
      );
    });

    it("should throw validation errors when a user tries to sign up with invalid properties", async function () {
      const user: UserDtoIn = {
        email: "I'm not an email",
        username: "I'm way too long to be a username, much too long",
        password: "123abc",
        phoneNumber: "Not a phone number",
        alertLimit: -8888,
      };

      try {
        await UserService.signUp(user);
      } catch (errors) {
        for (const error of errors) {
          expect(error).to.be.instanceOf(ValidationError);
        }
        expect(errors).to.have.property("length", 4);
        return;
      }

      return Promise.reject("No error was thrown.");
    });
  });

  describe("login()", function () {
    it("should be given an email and a password and return a jwt with the user's id", async function () {
      const user: UserDtoIn = {
        email: "test.user@test.domain.com",
        username: "Test_User",
        password: "123abc",
        phoneNumber: "+972-524444444",
        alertLimit: 0,
      };

      const registeredUser = await UserService.signUp(user);

      const userJwt = await UserService.login({
        email: user.email,
        password: user.password,
      });

      expect(jwt.decode(userJwt)).to.have.property("_id", registeredUser._id);
    });

    it("should throw a UserDoesNotExistError when provided a bad email", async function () {
      const user: UserLoginDto = {
        email: "test.user@test.domain.com",
        password: "123abc",
      };

      return expect(UserService.login(user)).to.be.rejectedWith(
        UserDoesNotExistError
      );
    });

    it("should throw a WrongPasswordError when provided an incorrect password", async function () {
      const user: UserDtoIn = {
        email: "test.user@test.domain.com",
        username: "Test_User",
        password: "123abc",
        phoneNumber: "+972-524444444",
        alertLimit: 0,
      };

      await UserService.signUp(user);

      return expect(
        UserService.login({
          email: user.email,
          password: "wrong",
        })
      ).to.be.rejectedWith(WrongPasswordError);
    });
  });

  describe("changePassword()", function () {
    it("should change a user's password", async function () {
      const user: UserDtoIn = {
        email: "test.user@test.domain.com",
        username: "Test_User",
        password: "123abc",
        phoneNumber: "+972-524444444",
        alertLimit: 0,
      };

      await UserService.signUp(user);

      const userDb = await userDbPromise;
      const { _id } = await userDb.findOne({ email: user.email });

      const newPassword = "new_pa$$word";
      await UserService.changePassword(
        _id.toHexString(),
        user.password,
        newPassword
      );

      const userFromDb = await userDb.findOne({ email: user.email });

      expect(await bcrypt.compare(newPassword, userFromDb.password)).to.be.true;
    });

    it("should throw a WrongPasswordError when given an incorrect old password", async function () {
      const user: UserDtoIn = {
        email: "test.user@test.domain.com",
        username: "Test_User",
        password: "123abc",
        phoneNumber: "+972-524444444",
        alertLimit: 0,
      };

      await UserService.signUp(user);

      const userDb = await userDbPromise;
      const { _id } = await userDb.findOne({ email: user.email });

      const newPassword = "new_pa$$word";

      return expect(
        UserService.changePassword(
          _id.toHexString(),
          "oops i'm not the password",
          newPassword
        )
      ).to.be.rejectedWith(WrongPasswordError);
    });
  });

  describe("updateUser()", function () {
    it("should update a user with their new properties", async function () {
      const user: UserDtoIn = {
        email: "test.user@test.domain.com",
        username: "Test_User",
        password: "123abc",
        phoneNumber: "+972-524444444",
        alertLimit: 0,
      };

      await UserService.signUp(user);

      const userDb = await userDbPromise;
      const { _id } = await userDb.findOne({ email: user.email });

      const update: UserUpdateDto = {
        email: "brandnewemail@gmail.com",
        username: "Cool_Test_User",
        alertLimit: 3600,
      };

      await UserService.updateUser(_id.toHexString(), update);

      const userFromDb = await userDb.findById(_id);
      expect(userFromDb.email).to.equal(update.email);
      expect(userFromDb.username).to.equal(update.username);
      expect(userFromDb.alertLimit).to.equal(update.alertLimit);
      expect(userFromDb.phoneNumber).to.equal(user.phoneNumber);
    });

    it("should throw a UserAlreadyExistsError when given a new email that's already taken", async function () {
      const user1: UserDtoIn = {
        email: "test.user@test.domain.com",
        username: "Test_User",
        password: "123abc",
        phoneNumber: "+972-524444444",
        alertLimit: 0,
      };

      await UserService.signUp(user1);

      const userDb = await userDbPromise;
      const { _id } = await userDb.findOne({ email: user1.email });

      const user2: UserDtoIn = {
        email: "test.user.2@test.domain.com",
        username: "my_username",
        password: "123abcd",
        alertLimit: 0,
      };

      await UserService.signUp(user2);

      const update: UserUpdateDto = {
        email: user2.email,
        username: "Cool_Test_User",
        alertLimit: 3600,
      };

      return expect(
        UserService.updateUser(_id.toHexString(), update)
      ).to.be.rejectedWith(UserAlreadyExistsError);
    });
  });

  describe("getRegisteredDtoById()", function () {
    it("should return a user's RegisteredUserDto given the user's id", async function () {
      const email = "test.user@test.domain.com";
      const username = "Test_User";

      const user: UserDtoIn = {
        email,
        username,
        password: "123abc",
        phoneNumber: "+972-524444444",
        alertLimit: 0,
      };

      const signUpDto = await UserService.signUp(user);

      const dto = await UserService.getRegisteredDtoById(signUpDto._id);

      expect(dto).to.deep.equal(signUpDto);
    });

    it("should throw a UserDoesNotExistError if the given id is invalid", function () {
      return expect(
        UserService.getRegisteredDtoById("5e72901430f200001fed7d40")
      ).to.be.rejectedWith(UserDoesNotExistError);
    });
  });
});
