import { suite, describe, it } from "mocha";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import UserDtoIn from "../../interfaces/dtos/userDtoIn";
import UserService from "../../services/userService";
import jwt from "jsonwebtoken";
import UserJwtPayload from "./../../interfaces/userJwtPayload";
import PreferenceService from "./../../services/preferenceService";
import cryptoSymbolManagerPromise from "./../../managers/cryptoSymbolManager";
import EventService from "./../../services/eventService";
import { userDbPromise } from "../../models/user";
import { assetDbPromise } from "../../models/asset";
import { cryptoSymbolDbPromise } from "../../models/cryptoSymbol";
import { symbolEventDbPromise } from "../../models/symbolEvent";
import lolex from "lolex";
chai.use(chaiAsPromised);

suite("EventService", function() {
  describe("getEvents()", function() {
    let clock: lolex.InstalledClock;
    this.beforeEach(function(): void {
      clock = lolex.install();
    });

    this.afterEach(function(): void {
      clock.uninstall();
    });

    it("should return a sorted array of EventDto when given a max limit amount", async function() {
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

      const { _id } = jwt.decode(userJwt) as UserJwtPayload;

      const cryptoSymbolManager = await cryptoSymbolManagerPromise;
      await cryptoSymbolManager.populate();

      await PreferenceService.setPreference(_id, "ABC", "DEF", 0.1);
      await PreferenceService.setPreference(_id, "BTC", "ETH", 0.2);

      const abcdef = await cryptoSymbolManager.getCryptoSymbol("ABC", "DEF");
      const btceth = await cryptoSymbolManager.getCryptoSymbol("BTC", "ETH");

      abcdef.addProbability(0.4);
      clock.tick(1);
      btceth.addProbability(0.5);

      const events = await EventService.getEvents(_id, 1);

      expect(events).to.have.property("length", 1);
      expect(events[0]).to.have.property("baseAssetName", "BTC");
      expect(events[0]).to.have.property("quoteAssetName", "ETH");

      // cleanup
      await (await userDbPromise).c.deleteMany({});
      await (await assetDbPromise).c.deleteMany({});
      await (await cryptoSymbolDbPromise).c.deleteMany({});
      await (await symbolEventDbPromise).c.deleteMany({});
    });

    it("should return a sorted array of all EventDtos", async function() {
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

      const { _id } = jwt.decode(userJwt) as UserJwtPayload;

      const cryptoSymbolManager = await cryptoSymbolManagerPromise;
      await cryptoSymbolManager.populate();

      await PreferenceService.setPreference(_id, "ABC", "DEF", 0.1);
      await PreferenceService.setPreference(_id, "BTC", "ETH", 0.2);

      const abcdef = await cryptoSymbolManager.getCryptoSymbol("ABC", "DEF");
      const btceth = await cryptoSymbolManager.getCryptoSymbol("BTC", "ETH");

      abcdef.addProbability(0.4);
      clock.tick(1);
      btceth.addProbability(0.5);

      const events = await EventService.getEvents(_id);

      expect(events).to.have.property("length", 2);
      expect(events[0]).to.have.property("baseAssetName", "BTC");
      expect(events[0]).to.have.property("quoteAssetName", "ETH");
      expect(events[1]).to.have.property("baseAssetName", "ABC");
      expect(events[1]).to.have.property("quoteAssetName", "DEF");

      // cleanup
      await (await userDbPromise).c.deleteMany({});
      await (await assetDbPromise).c.deleteMany({});
      await (await cryptoSymbolDbPromise).c.deleteMany({});
      await (await symbolEventDbPromise).c.deleteMany({});
    });

    it("should throw a RangeError if given a negative amount", async function() {
      expect(
        EventService.getEvents("0000000092a2141f3cb7a66a", -1)
      ).to.be.rejectedWith(RangeError);
    });
  });
});
