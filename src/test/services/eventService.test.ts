import { suite, describe, it } from "mocha";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import UserDtoIn from "../../dtos/userDtoIn";
import UserService from "../../services/userService";
import jwt from "jsonwebtoken";
import UserJwtPayload from "../../interfaces/userJwtPayload";
import PreferenceService from "./../../services/preferenceService";
import cryptoSymbolManagerPromise from "./../../managers/cryptoSymbolManager";
import EventService from "./../../services/eventService";
import { userDbPromise } from "../../models/user";
import { assetDbPromise } from "../../models/asset";
import { cryptoSymbolDbPromise } from "../../models/cryptoSymbol";
import { symbolEventDbPromise } from "../../models/symbolEvent";
import lolex from "lolex";
import { SymbolEvent } from "./../../models/symbolEvent";
import { CryptoSymbolInfo } from "./../../models/cryptoSymbolInfo";
import { Asset } from "./../../models/asset";
chai.use(chaiAsPromised);

suite("EventService", function () {
  describe("getEvents()", function () {
    let clock: lolex.InstalledClock;
    this.beforeEach(function (): void {
      clock = lolex.install();
    });

    this.afterEach(function (): void {
      clock.uninstall();
    });

    it("should return a sorted array of EventDto when given a max limit amount", async function () {
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

    it("should return a sorted array of all EventDtos", async function () {
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

      const { _id } = jwt.decode(userJwt) as UserJwtPayload;

      const cryptoSymbolManager = await cryptoSymbolManagerPromise;
      await cryptoSymbolManager.populate();

      await PreferenceService.setPreference(_id, "ABC", "DEF", 0.1);
      await PreferenceService.setPreference(_id, "BTC", "ETH", 0.2);
      await PreferenceService.setPreference(_id, "TRX", "BTC", -0.3);

      const abcdef = await cryptoSymbolManager.getCryptoSymbol("ABC", "DEF");
      const btceth = await cryptoSymbolManager.getCryptoSymbol("BTC", "ETH");
      const trxbtc = await cryptoSymbolManager.getCryptoSymbol("TRX", "BTC");

      abcdef.addProbability(0.4);
      clock.tick(1);
      btceth.addProbability(0.5);
      clock.tick(1);
      trxbtc.addProbability(0.8);

      const events = await EventService.getEvents(_id);

      expect(events).to.have.property("length", 3);
      expect(events[0]).to.have.property("baseAssetName", "TRX");
      expect(events[0]).to.have.property("quoteAssetName", "BTC");
      expect(events[1]).to.have.property("baseAssetName", "BTC");
      expect(events[1]).to.have.property("quoteAssetName", "ETH");
      expect(events[2]).to.have.property("baseAssetName", "ABC");
      expect(events[2]).to.have.property("quoteAssetName", "DEF");

      // cleanup
      await (await userDbPromise).c.deleteMany({});
      await (await assetDbPromise).c.deleteMany({});
      await (await cryptoSymbolDbPromise).c.deleteMany({});
      await (await symbolEventDbPromise).c.deleteMany({});
    });

    it("should throw a RangeError if given a negative amount", async function () {
      expect(
        EventService.getEvents("0000000092a2141f3cb7a66a", -1)
      ).to.be.rejectedWith(RangeError);
    });
  });

  describe("findEventById()", function () {
    it("should retrieve an EventDto given its id", async function () {
      const btc = new Asset("BTC");
      const usdt = new Asset("USDT");
      const assetDb = await assetDbPromise;
      await assetDb.insert(btc);
      await assetDb.insert(usdt);

      const event = new SymbolEvent(0.8, new CryptoSymbolInfo(btc, usdt));
      const symbolEventDb = await symbolEventDbPromise;

      await symbolEventDb.insert(event);

      const retrieved = await EventService.findEventById(
        event._id.toHexString()
      );

      expect(retrieved).to.have.property("_id", event._id.toHexString());
      expect(retrieved).to.have.property(
        "baseAssetName",
        event.cryptoSymbolInfo.baseAsset.name
      );
      expect(retrieved).to.have.property(
        "quoteAssetName",
        event.cryptoSymbolInfo.quoteAsset.name
      );
      expect(retrieved).to.have.property("probability", event.probability);
      expect(retrieved).to.have.property("firedAt", event.firedAt);

      await symbolEventDb.c.deleteMany({});
      await assetDb.c.deleteMany({});
    });

    it("should throw an error if the given id is invalid", async function () {
      await expect(EventService.findEventById("uhuhhhgtggghh")).to.be.rejected;
      return expect(
        EventService.findEventById("5e196cd3bb5f685ca029e93d")
      ).to.be.rejected;
    });
  });
});
