import { suite, describe, it } from "mocha";
import server from "./../../index";
import request from "supertest";
import { expect } from "chai";
import { OK, BAD_REQUEST, NOT_FOUND } from "http-status-codes";
import { cryptoSymbolDbPromise } from "../../models/cryptoSymbol";
import { assetDbPromise, Asset } from "../../models/asset";
import { userDbPromise } from "../../models/user";
import cryptoSymbolManagerPromise from "./../../managers/cryptoSymbolManager";
import jwt from "jsonwebtoken";
import lolex from "lolex";
import UserDtoIn from "../../dtos/userDtoIn";
import UserService from "../../services/userService";
import UserJwtPayload from "../../interfaces/userJwtPayload";
import PreferenceService from "../../services/preferenceService";
import EventDto from "../../dtos/eventDto";
import { symbolEventDbPromise, SymbolEvent } from "../../models/symbolEvent";
import { CryptoSymbolInfo } from "../../models/cryptoSymbolInfo";

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

  describe("GET /:id (getById())", function() {
    it("should return an EventDto given its id and a status of 200 OK", async function() {
      const btc = new Asset("BTC");
      const usdt = new Asset("USDT");
      const assetDb = await assetDbPromise;
      await assetDb.insert(btc);
      await assetDb.insert(usdt);

      const event = new SymbolEvent(0.8, new CryptoSymbolInfo(btc, usdt));
      const symbolEventDb = await symbolEventDbPromise;

      await symbolEventDb.insert(event);

      const response = await request(server).get(
        `${route}/${event._id.toHexString()}`
      );

      expect(response.status).to.equal(OK);

      const retrieved = response.body;

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

      await symbolEventDb.c.deleteMany({});
      await assetDb.c.deleteMany({});
    });

    it("should return a status of 404 Not Found when provided a bad id", async function() {
      let response = await request(server).get(`${route}/uhuhhhgtggghh`);
      expect(response.status).to.equal(NOT_FOUND);

      response = await request(server).get(`${route}/5e196cd3bb5f685ca029e93d`);
      expect(response.status).to.equal(NOT_FOUND);
    });
  });
});
