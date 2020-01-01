import { suite, describe, it } from "mocha";
import { userDbPromise } from "../../models/user";
import UserJwtPayload from "./../../interfaces/userJwtPayload";
import cryptoSymbolManagerPromise from "./../../managers/cryptoSymbolManager";
import { assetDbPromise } from "../../models/asset";
import { cryptoSymbolDbPromise } from "../../models/cryptoSymbol";
import UserDtoIn from "../../interfaces/dtos/userDtoIn";
import UserService from "../../services/userService";
import PreferenceService from "./../../services/preferenceService";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import jwt from "jsonwebtoken";
import UserDoesNotExistError from "../../errors/userDoesNotExistError";
chai.use(chaiAsPromised);

suite("PreferenceService", function() {
  this.afterEach(async function() {
    const userDb = await userDbPromise;
    return userDb.c.deleteMany({});
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

      await cryptoSymbolDb.c.deleteMany({});
      return (await assetDbPromise).c.deleteMany({});
    });

    it("should throw a UserDoesNotExistError when provided a bad id", async function() {
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

    it("should throw a RangeError given a probability that's not between -1 and 1", async function() {
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
  });
});
