import { suite, describe, it } from "mocha";
import server from "./../../index";
import request from "supertest";
import { expect } from "chai";
import UserDtoIn from "../../interfaces/dtos/userDtoIn";
import { NO_CONTENT, UNPROCESSABLE_ENTITY } from "http-status-codes";
import { cryptoSymbolDbPromise } from "../../models/cryptoSymbol";
import { assetDbPromise } from "../../models/asset";
import { userDbPromise } from "../../models/user";
import cryptoSymbolManagerPromise from "./../../managers/cryptoSymbolManager";
import jwt from "jsonwebtoken";
import UserJwtPayload from "./../../interfaces/userJwtPayload";

const route = "/api/preferences";
suite(`${route} (PreferenceController)`, function() {
  describe("POST / (setPreference())", function() {
    it("should save the preference and return a 204 No Content status code", async function() {
      const cryptoSymbolManager = await cryptoSymbolManagerPromise;
      await cryptoSymbolManager.populate();
      const user: UserDtoIn = {
        email: "abc@def.com",
        username: "atestuser",
        password: "atestpassword"
      };

      // signup
      await request(server)
        .post("/api/users")
        .send(user);

      // login
      let response = await request(server)
        .post("/api/users/login")
        .send({
          email: user.email,
          password: user.password
        });

      const { jwt: userJwt } = response.body;

      response = await request(server)
        .post(route)
        .set("Authorization", `Bearer ${userJwt}`)
        .send({
          baseAssetName: "BTC",
          quoteAssetName: "USDT",
          probability: 0.6
        });

      const { _id } = jwt.decode(userJwt) as UserJwtPayload;

      expect(response.status).to.equal(NO_CONTENT);
      expect(cryptoSymbolManager.cryptoSymbols.has("BTCUSDT")).to.be.true;
      expect(
        cryptoSymbolManager.cryptoSymbols
          .get("BTCUSDT")
          .cryptoSymbolInfo.preferences.get(_id)
      ).to.equal(0.6);

      // cleanup
      await (await cryptoSymbolDbPromise).c.deleteMany({});
      await (await assetDbPromise).c.deleteMany({});
      await (await userDbPromise).c.deleteMany({});
    });

    it("should not save the preference if the given probability is not between -1 and 1 and return a 422 Unprocessable Entity status code", async function() {
      const cryptoSymbolManager = await cryptoSymbolManagerPromise;
      await cryptoSymbolManager.populate();
      const user: UserDtoIn = {
        email: "abc@def.com",
        username: "atestuser",
        password: "atestpassword"
      };

      // signup
      await request(server)
        .post("/api/users")
        .send(user);

      // login
      let response = await request(server)
        .post("/api/users/login")
        .send({
          email: user.email,
          password: user.password
        });

      const { jwt } = response.body;

      response = await request(server)
        .post(route)
        .set("Authorization", `Bearer ${jwt}`)
        .send({
          baseAssetName: "BTC",
          quoteAssetName: "USDT",
          probability: 2
        });

      expect(response.status).to.equal(UNPROCESSABLE_ENTITY);
      expect(response.body).to.have.property("error");
      expect(cryptoSymbolManager.cryptoSymbols.has("BTCUSDT")).to.be.false;

      // cleanup
      await (await cryptoSymbolDbPromise).c.deleteMany({});
      await (await assetDbPromise).c.deleteMany({});
      await (await userDbPromise).c.deleteMany({});
    });

    it("should not save the preference if the given user does not exist and return a 422 Unprocessable Entity status code", async function() {
      const cryptoSymbolManager = await cryptoSymbolManagerPromise;
      await cryptoSymbolManager.populate();
      const user: UserDtoIn = {
        email: "abc@def.com",
        username: "atestuser",
        password: "atestpassword"
      };

      // signup
      await request(server)
        .post("/api/users")
        .send(user);

      // login
      let response = await request(server)
        .post("/api/users/login")
        .send({
          email: user.email,
          password: user.password
        });

      const { jwt } = response.body;

      // now the user does not exist
      await (await userDbPromise).c.deleteMany({});

      response = await request(server)
        .post(route)
        .set("Authorization", `Bearer ${jwt}`)
        .send({
          baseAssetName: "BTC",
          quoteAssetName: "USDT",
          probability: -0.1
        });

      expect(response.status).to.equal(UNPROCESSABLE_ENTITY);
      expect(response.body).to.have.property("error");
      expect(cryptoSymbolManager.cryptoSymbols.has("BTCUSDT")).to.be.false;

      // cleanup
      await (await cryptoSymbolDbPromise).c.deleteMany({});
      await (await assetDbPromise).c.deleteMany({});
    });

    it("should not save the preference if the given assets are bad and return a 422 Unprocessable Entity status code", async function() {
      const cryptoSymbolManager = await cryptoSymbolManagerPromise;
      await cryptoSymbolManager.populate();
      const user: UserDtoIn = {
        email: "abc@def.com",
        username: "atestuser",
        password: "atestpassword"
      };

      // signup
      await request(server)
        .post("/api/users")
        .send(user);

      // login
      let response = await request(server)
        .post("/api/users/login")
        .send({
          email: user.email,
          password: user.password
        });

      const { jwt } = response.body;

      response = await request(server)
        .post(route)
        .set("Authorization", `Bearer ${jwt}`)
        .send({
          baseAssetName: "lowercase",
          quoteAssetName: "USDToops",
          probability: 0.8
        });

      expect(response.status).to.equal(UNPROCESSABLE_ENTITY);
      expect(response.body).to.have.property("errors");
      expect(
        cryptoSymbolManager.cryptoSymbols.has("lowercaseUSDToops")
      ).to.be.false;

      // cleanup
      await (await cryptoSymbolDbPromise).c.deleteMany({});
      await (await assetDbPromise).c.deleteMany({});
      await (await userDbPromise).c.deleteMany({});
    });
  });

  describe("DELETE / (deletePreference())", function() {
    it("should remove a given user's preference and return a 204 No Content status code", async function() {
      const cryptoSymbolManager = await cryptoSymbolManagerPromise;
      await cryptoSymbolManager.populate();
      const user: UserDtoIn = {
        email: "abc@def.com",
        username: "atestuser",
        password: "atestpassword"
      };

      // signup
      await request(server)
        .post("/api/users")
        .send(user);

      // login
      let response = await request(server)
        .post("/api/users/login")
        .send({
          email: user.email,
          password: user.password
        });

      const { jwt: userJwt } = response.body;

      // add preference
      await request(server)
        .post(route)
        .set("Authorization", `Bearer ${userJwt}`)
        .send({
          baseAssetName: "BTC",
          quoteAssetName: "USDT",
          probability: 0.6
        });

      response = await request(server)
        .delete(`${route}?baseAssetName=BTC&quoteAssetName=USDT`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send();

      expect(response.status).to.equal(NO_CONTENT);

      expect(
        cryptoSymbolManager.cryptoSymbols
          .get("BTCUSDT")
          .cryptoSymbolInfo.preferences.has(
            (jwt.decode(userJwt) as UserJwtPayload)._id
          )
      ).to.be.false;

      // cleanup
      await (await cryptoSymbolDbPromise).c.deleteMany({});
      await (await assetDbPromise).c.deleteMany({});
      await (await userDbPromise).c.deleteMany({});
    });

    it("should return a 422 Unprocessable Entity status code if the given user does not exist", async function() {
      const cryptoSymbolManager = await cryptoSymbolManagerPromise;
      await cryptoSymbolManager.populate();
      const user: UserDtoIn = {
        email: "abc@def.com",
        username: "atestuser",
        password: "atestpassword"
      };

      // signup
      await request(server)
        .post("/api/users")
        .send(user);

      // login
      let response = await request(server)
        .post("/api/users/login")
        .send({
          email: user.email,
          password: user.password
        });

      const { jwt } = response.body;

      // now the user does not exist
      await (await userDbPromise).c.deleteMany({});

      response = await request(server)
        .delete(`${route}?baseAssetName=BTC&quoteAssetName=USDT`)
        .set("Authorization", `Bearer ${jwt}`)
        .send();

      expect(response.status).to.equal(UNPROCESSABLE_ENTITY);
      expect(response.body).to.have.property("error");

      // cleanup
      await (await cryptoSymbolDbPromise).c.deleteMany({});
      await (await assetDbPromise).c.deleteMany({});
    });
  });
});
