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
import UserJwtPayload from "./../../interfaces/userJwtPayload";
import SetPreferenceDto from "./../../interfaces/dtos/setPreferenceDto";
import cryptoSymbolManagerPromise from "./../../managers/cryptoSymbolManager";
import { assetDbPromise } from "../../models/asset";
import { cryptoSymbolDbPromise } from "../../models/cryptoSymbol";

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
        phoneNumber: "+972-524444444"
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
        phoneNumber: "+972-524444444"
      };

      const user2: UserDtoIn = {
        email,
        username: "Another-Test-User",
        password: "123456",
        phoneNumber: "+972-52111111"
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
        phoneNumber: "Not a phone number"
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
        phoneNumber: "+972-524444444"
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
        phoneNumber: "+972-524444444"
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

  describe("setPreference()", function() {
    it("should add a given preference when the user exists", async function() {
      const user: UserDtoIn = {
        email: "test.user@test.domain.com",
        username: "Test_User",
        password: "123abc",
        phoneNumber: "+972-524444444"
      };

      const registeredUser = await UserService.signUp(user);

      const userJwt = await UserService.login({
        email: registeredUser.email,
        password: user.password
      });

      const payload: UserJwtPayload = jwt.decode(userJwt) as any;

      const userId: string = payload._id;
      const probability = -0.1;
      const baseAssetName = "ABC";
      const quoteAssetName = "DEF";
      const request: SetPreferenceDto = {
        userId,
        probability,
        baseAssetName,
        quoteAssetName
      };

      await UserService.setPreference(request);

      const cryptoSymbol = await (
        await cryptoSymbolManagerPromise
      ).getCryptoSymbol(baseAssetName, quoteAssetName);

      expect(cryptoSymbol.cryptoSymbolInfo.preferences.get(userId)).to.equal(
        probability
      );

      await (await cryptoSymbolDbPromise).c.deleteMany({});
      return (await assetDbPromise).c.deleteMany({});
    });

    it("should throw a UserDoesNotExistError when provided a bad id", async function() {
      let request: SetPreferenceDto = {
        userId: "I don't exist",
        baseAssetName: "ABC",
        quoteAssetName: "DEF",
        probability: 0.1
      };

      await expect(UserService.setPreference(request)).to.be.rejectedWith(
        UserDoesNotExistError
      );

      // valid id but empty db
      request = {
        userId: "5d5072c1d19ed00f84e4c35d",
        baseAssetName: "ABC",
        quoteAssetName: "DEF",
        probability: 0.1
      };

      return expect(UserService.setPreference(request)).to.be.rejectedWith(
        UserDoesNotExistError
      );
    });

    it("should throw a RangeError given a probability that's not between -1 and 1", async function() {
      let request: SetPreferenceDto = {
        userId: "5d5072c1d19ed00f84e4c35d",
        baseAssetName: "ABC",
        quoteAssetName: "DEF",
        probability: 2
      };

      await expect(UserService.setPreference(request)).to.be.rejectedWith(
        RangeError
      );

      request = {
        userId: "5d5072c1d19ed00f84e4c35d",
        baseAssetName: "ABC",
        quoteAssetName: "DEF",
        probability: -2
      };

      return expect(UserService.setPreference(request)).to.be.rejectedWith(
        RangeError
      );
    });
  });
});
