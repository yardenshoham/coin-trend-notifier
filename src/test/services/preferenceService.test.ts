import { suite, describe, it } from "mocha";
import { userDbPromise } from "../../models/user";
import UserJwtPayload from "../../interfaces/userJwtPayload";
import cryptoSymbolManagerPromise from "./../../managers/cryptoSymbolManager";
import { assetDbPromise } from "../../models/asset";
import { cryptoSymbolDbPromise } from "../../models/cryptoSymbol";
import UserDtoIn from "../../dtos/userDtoIn";
import UserService from "../../services/userService";
import PreferenceService from "./../../services/preferenceService";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import jwt from "jsonwebtoken";
import UserDoesNotExistError from "../../errors/userDoesNotExistError";
chai.use(chaiAsPromised);

suite("PreferenceService", function () {
  this.afterEach(async function () {
    await (await userDbPromise).c.deleteMany({});
    await (await cryptoSymbolDbPromise).c.deleteMany({});
    return (await assetDbPromise).c.deleteMany({});
  });

  describe("setPreference()", function () {
    it("should add a given preference when the user exists", async function () {
      const user: UserDtoIn = {
        email: "test.user@test.domain.com",
        username: "Test_User",
        password: "123abc",
        phoneNumber: "+972-524444444",
        alertLimit: 0,
      };

      const registeredUser = await UserService.signUp(user);

      const userJwt = await UserService.login({
        email: registeredUser.email,
        password: user.password,
      });

      const payload: UserJwtPayload = jwt.decode(userJwt) as any;

      const userId: string = payload._id;
      const probability = -0.1;
      const baseAssetName = "ABC";
      const quoteAssetName = "DEF";

      const cryptoSymbolManager = await cryptoSymbolManagerPromise;
      await cryptoSymbolManager.populate();
      await PreferenceService.setPreference(
        userId,
        baseAssetName,
        quoteAssetName,
        probability
      );

      const cryptoSymbolDb = await cryptoSymbolDbPromise;
      expect(await cryptoSymbolDb.count()).to.equal(1);

      const cryptoSymbol = await cryptoSymbolManager.getCryptoSymbol(
        baseAssetName,
        quoteAssetName
      );

      expect(cryptoSymbol.cryptoSymbolInfo.preferences.get(userId)).to.equal(
        probability
      );
    });

    it("should throw a UserDoesNotExistError when provided a bad id", async function () {
      let userId = "I don't exist";
      let baseAssetName = "ABC";
      let quoteAssetName = "DEF";
      let probability = 0.1;

      await expect(
        PreferenceService.setPreference(
          userId,
          baseAssetName,
          quoteAssetName,
          probability
        )
      ).to.be.rejectedWith(UserDoesNotExistError);

      // valid id but empty db
      userId = "5d5072c1d19ed00f84e4c35d";

      return expect(
        PreferenceService.setPreference(
          userId,
          baseAssetName,
          quoteAssetName,
          probability
        )
      ).to.be.rejectedWith(UserDoesNotExistError);
    });

    it("should throw a RangeError given a probability that's not between -1 and 1", async function () {
      let userId = "5d5072c1d19ed00f84e4c35d";
      let baseAssetName = "ABC";
      let quoteAssetName = "DEF";
      let probability = 2;

      await expect(
        PreferenceService.setPreference(
          userId,
          baseAssetName,
          quoteAssetName,
          probability
        )
      ).to.be.rejectedWith(RangeError);

      probability = -2;

      return expect(
        PreferenceService.setPreference(
          userId,
          baseAssetName,
          quoteAssetName,
          probability
        )
      ).to.be.rejectedWith(RangeError);
    });

    it("should throw an error when baseAssetName is the same as quoteAssetName", function () {
      let userId = "5d5072c1d19ed00f84e4c35d";
      let baseAssetName = "TRX";
      let quoteAssetName = "TRX";
      let probability = 0.5;
      return expect(
        PreferenceService.setPreference(
          userId,
          baseAssetName,
          quoteAssetName,
          probability
        )
      ).to.be.rejectedWith(Error);
    });
  });

  describe("deletePreference()", function () {
    it("should delete a preference when one was added", async function () {
      const cryptoSymbolManager = await cryptoSymbolManagerPromise;
      await cryptoSymbolManager.populate();
      const user: UserDtoIn = {
        email: "test.user@test.domain.com",
        username: "Test_User",
        password: "123abc",
        phoneNumber: "+972-524444444",
        alertLimit: 0,
      };

      const registeredUser = await UserService.signUp(user);

      const userJwt = await UserService.login({
        email: registeredUser.email,
        password: user.password,
      });

      const payload: UserJwtPayload = jwt.decode(userJwt) as any;

      const userId: string = payload._id;
      const probability = -0.1;
      const baseAssetName = "ABC";
      const quoteAssetName = "DEF";

      await PreferenceService.setPreference(
        userId,
        baseAssetName,
        quoteAssetName,
        probability
      );

      const cryptoSymbolDb = await cryptoSymbolDbPromise;
      expect(await cryptoSymbolDb.count()).to.equal(1);

      await PreferenceService.deletePreference(
        userId,
        baseAssetName,
        quoteAssetName
      );

      const cryptoSymbol = await cryptoSymbolManager.getCryptoSymbol(
        baseAssetName,
        quoteAssetName
      );

      expect(cryptoSymbol.cryptoSymbolInfo.preferences.has(userId)).to.be.false;
    });

    it("should delete a preference when one was not added (do nothing)", async function () {
      const cryptoSymbolManager = await cryptoSymbolManagerPromise;
      await cryptoSymbolManager.populate();
      const user: UserDtoIn = {
        email: "test.user@test.domain.com",
        username: "Test_User",
        password: "123abc",
        phoneNumber: "+972-524444444",
        alertLimit: 0,
      };

      const registeredUser = await UserService.signUp(user);

      const userJwt = await UserService.login({
        email: registeredUser.email,
        password: user.password,
      });

      const payload: UserJwtPayload = jwt.decode(userJwt) as any;

      const userId: string = payload._id;
      const baseAssetName = "ABC";
      const quoteAssetName = "DEF";

      await PreferenceService.deletePreference(
        userId,
        baseAssetName,
        quoteAssetName
      );

      const cryptoSymbol = await cryptoSymbolManager.getCryptoSymbol(
        baseAssetName,
        quoteAssetName
      );

      expect(cryptoSymbol.cryptoSymbolInfo.preferences.has(userId)).to.be.false;
    });

    it("should throw a UserDoesNotExistError when provided a bad user id", async function () {
      let userId = "I don't exist";
      let baseAssetName = "ABC";
      let quoteAssetName = "DEF";

      await expect(
        PreferenceService.deletePreference(
          userId,
          baseAssetName,
          quoteAssetName
        )
      ).to.be.rejectedWith(UserDoesNotExistError);

      // valid id but empty db
      userId = "5d5072c1d19ed00f84e4c35d";

      return expect(
        PreferenceService.deletePreference(
          userId,
          baseAssetName,
          quoteAssetName
        )
      ).to.be.rejectedWith(UserDoesNotExistError);
    });
  });

  describe("getPreferences()", function () {
    it("should return all preferences of a given user", async function () {
      const cryptoSymbolManager = await cryptoSymbolManagerPromise;
      await cryptoSymbolManager.populate();
      const user: UserDtoIn = {
        email: "abc@def.com",
        username: "atestuser",
        password: "atestpassword",
        alertLimit: 0,
      };

      // signup
      const { _id } = await UserService.signUp(user);

      // login
      await UserService.login({
        email: user.email,
        password: user.password,
      });

      // add preferences
      const preferences = [
        {
          baseAssetName: "BTC",
          quoteAssetName: "USDT",
          probability: 0.6,
        },
        {
          baseAssetName: "ABC",
          quoteAssetName: "DEF",
          probability: -0.1,
        },
        {
          baseAssetName: "QWER",
          quoteAssetName: "TYUI",
          probability: 0.4,
        },
      ];

      await Promise.all(
        preferences.map((preference) => {
          return PreferenceService.setPreference(
            _id,
            preference.baseAssetName,
            preference.quoteAssetName,
            preference.probability
          );
        })
      );

      const returnedPreferences = await PreferenceService.getPreferences(_id);

      expect(returnedPreferences).to.have.property(
        "length",
        preferences.length
      );

      for (const p of returnedPreferences) {
        expect(preferences).to.deep.include(p);
      }
    });

    it("should throw a UserDoesNotExistError if given a bad user id", async function () {
      let userId = "I don't exist";

      await expect(PreferenceService.getPreferences(userId)).to.be.rejectedWith(
        UserDoesNotExistError
      );

      // valid id but empty db
      userId = "5d5072c1d19ed00f84e4c35d";

      return expect(
        PreferenceService.getPreferences(userId)
      ).to.be.rejectedWith(UserDoesNotExistError);
    });
  });
});
