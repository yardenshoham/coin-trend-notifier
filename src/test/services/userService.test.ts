import { suite, describe, it } from "mocha";
import chai, { expect } from "chai";
import UserDtoIn from "../../interfaces/dtos/userDtoIn";
import UserService from "./../../services/userService";
import { userDbPromise } from "../../models/user";
import chaiAsPromised from "chai-as-promised";
import UserAlreadyExistsError from "./../../errors/userAlreadyExistsError";
import { ValidationError } from "class-validator";
import jwt from "jsonwebtoken";
import UserDoesNotExistError from "./../../errors/userDoesNotExistError";
import UserLoginDto from "./../../interfaces/dtos/userLoginDto";
import WrongPasswordError from "../../errors/wrongPasswordError";

chai.use(chaiAsPromised);

suite("UserService", function() {
  this.afterEach(async function() {
    const userDb = await userDbPromise;
    return userDb.c.deleteMany({});
  });

  describe("signUp()", function() {
    it("should be given a user and register them", async function() {
      const email = "test.user@test.domain.com";
      const username = "Test_User";

      const user: UserDtoIn = {
        email,
        username,
        password: "123abc",
        phoneNumber: "+972-524444444",
        alertLimit: 0
      };

      await UserService.signUp(user);

      const userDb = await userDbPromise;
      const userFromDb = await userDb.findOne({ email });

      expect(userFromDb).to.have.property("username", username);
    });

    it("should throw a UserAlreadyExistsError when a user with the same email address as one that already exists tries to sign up", async function() {
      const email = "test.user@test.domain.com";

      const user1: UserDtoIn = {
        email,
        username: "Test_User",
        password: "123abc",
        phoneNumber: "+972-524444444",
        alertLimit: 0
      };

      const user2: UserDtoIn = {
        email,
        username: "Another-Test-User",
        password: "123456",
        phoneNumber: "+972-52111111",
        alertLimit: 0
      };

      await UserService.signUp(user1);

      return expect(UserService.signUp(user2)).to.be.rejectedWith(
        UserAlreadyExistsError
      );
    });

    it("should throw validation errors when a user tries to sign up with invalid properties", async function() {
      const user: UserDtoIn = {
        email: "I'm not an email",
        username: "I'm way too long to be a username, much too long",
        password: "123abc",
        phoneNumber: "Not a phone number",
        alertLimit: -8888
      };

      try {
        await UserService.signUp(user);
      } catch (errors) {
        for (const error of errors) {
          expect(error).to.be.instanceOf(ValidationError);
        }
        expect(errors).to.have.property("length", 3);
        return;
      }

      return Promise.reject("No error was thrown.");
    });
  });

  describe("login()", function() {
    it("should be given an email and a password and return a jwt with the user's id", async function() {
      const user: UserDtoIn = {
        email: "test.user@test.domain.com",
        username: "Test_User",
        password: "123abc",
        phoneNumber: "+972-524444444",
        alertLimit: 0
      };

      const registeredUser = await UserService.signUp(user);

      const userJwt = await UserService.login({
        email: user.email,
        password: user.password
      });

      expect(jwt.decode(userJwt)).to.have.property("_id", registeredUser._id);
    });

    it("should throw a UserDoesNotExistError when provided a bad email", async function() {
      const user: UserLoginDto = {
        email: "test.user@test.domain.com",
        password: "123abc"
      };

      return expect(UserService.login(user)).to.be.rejectedWith(
        UserDoesNotExistError
      );
    });

    it("should throw a WrongPasswordError when provided an incorrect password", async function() {
      const user: UserDtoIn = {
        email: "test.user@test.domain.com",
        username: "Test_User",
        password: "123abc",
        phoneNumber: "+972-524444444",
        alertLimit: 0
      };

      await UserService.signUp(user);

      return expect(
        UserService.login({
          email: user.email,
          password: "wrong"
        })
      ).to.be.rejectedWith(WrongPasswordError);
    });
  });
});
