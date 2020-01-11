import { suite, describe, it } from "mocha";
import server from "./../../index";
import request from "supertest";
import { expect } from "chai";
import { OK, BAD_REQUEST } from "http-status-codes";
import { cryptoSymbolDbPromise } from "../../models/cryptoSymbol";
import { assetDbPromise } from "../../models/asset";
import { userDbPromise } from "../../models/user";
import cryptoSymbolManagerPromise from "./../../managers/cryptoSymbolManager";
import jwt from "jsonwebtoken";
import lolex from "lolex";
import UserDtoIn from "../../interfaces/dtos/userDtoIn";
import UserService from "../../services/userService";
import UserJwtPayload from "../../interfaces/userJwtPayload";
import PreferenceService from "../../services/preferenceService";
import EventDto from "./../../interfaces/dtos/eventDto";
import { symbolEventDbPromise } from "../../models/symbolEvent";

const route = "/api/events";
suite(`${route} (EventController)`, function() {
  describe("GET / (getEvents())", function() {
    let clock: lolex.InstalledClock;
    this.beforeEach(function(): void {
      clock = lolex.install();
    });

    this.afterEach(function(): void {
      clock.uninstall();
    });

    it("should return all the user's events and a status code of 200 OK", async function() {
      const user: UserDtoIn = {
        email: "test.user@test.domain.com",
        username: "Test_User",
        password: "123abc",
        phoneNumber: "+972-524444444",
        alertLimit: 0
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

      clock.tick(10);
      abcdef.addProbability(0.4);
      const abcdefFiredAt = Date.now();
      clock.tick(10);
      btceth.addProbability(0.5);
      const btcethFiredAt = Date.now();

      const response = await request(server)
        .get(route)
        .set("Authorization", `Bearer ${userJwt}`);

      expect(response.status).to.equal(OK);

      const events: EventDto[] = response.body;

      expect(events).to.have.property("length", 2);
      expect(events[0]).to.have.property("baseAssetName", "BTC");
      expect(events[0]).to.have.property("quoteAssetName", "ETH");
      expect(events[0]).to.have.property("firedAt", btcethFiredAt);
      expect(events[1]).to.have.property("baseAssetName", "ABC");
      expect(events[1]).to.have.property("quoteAssetName", "DEF");
      expect(events[1]).to.have.property("firedAt", abcdefFiredAt);

      // cleanup
      await (await userDbPromise).c.deleteMany({});
      await (await assetDbPromise).c.deleteMany({});
      await (await cryptoSymbolDbPromise).c.deleteMany({});
      await (await symbolEventDbPromise).c.deleteMany({});
    });

    it("should return a given amount of events and status code of 200 OK", async function() {
      const user: UserDtoIn = {
        email: "test.user@test.domain.com",
        username: "Test_User",
        password: "123abc",
        phoneNumber: "+972-524444444",
        alertLimit: 0
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

      clock.tick(10);
      abcdef.addProbability(0.4);
      clock.tick(10);
      btceth.addProbability(0.5);
      const btcethFiredAt = Date.now();

      const response = await request(server)
        .get(`${route}?amount=1`)
        .set("Authorization", `Bearer ${userJwt}`);

      expect(response.status).to.equal(OK);

      const events: EventDto[] = response.body;

      expect(events).to.have.property("length", 1);
      expect(events[0]).to.have.property("baseAssetName", "BTC");
      expect(events[0]).to.have.property("quoteAssetName", "ETH");
      expect(events[0]).to.have.property("firedAt", btcethFiredAt);

      // cleanup
      await (await userDbPromise).c.deleteMany({});
      await (await assetDbPromise).c.deleteMany({});
      await (await cryptoSymbolDbPromise).c.deleteMany({});
      await (await symbolEventDbPromise).c.deleteMany({});
    });

    it("should return 400 Bad Request if given a negative amount", async function() {
      const user: UserDtoIn = {
        email: "test.user@test.domain.com",
        username: "Test_User",
        password: "123abc",
        phoneNumber: "+972-524444444",
        alertLimit: 0
      };

      const registeredUser = await UserService.signUp(user);

      const userJwt = await UserService.login({
        email: registeredUser.email,
        password: user.password
      });

      const response = await request(server)
        .get(`${route}?amount=-1`)
        .set("Authorization", `Bearer ${userJwt}`);

      expect(response.status).to.equal(BAD_REQUEST);

      // cleanup
      await (await userDbPromise).c.deleteMany({});
    });
  });
});
