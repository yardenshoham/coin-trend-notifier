import { suite, describe, it } from "mocha";
import server from "./../../index";
import { expect } from "chai";
import { userDbPromise } from "./../../models/user";
import request from "supertest";
import { assetDbPromise } from "../../models/asset";
import { cryptoSymbolDbPromise } from "../../models/cryptoSymbol";
import UserDtoIn from "./../../interfaces/dtos/userDtoIn";
import { UNAUTHORIZED, BAD_REQUEST } from "http-status-codes";

const testRoute = "/api/preferences";
suite("AuthMiddleware", function() {
  describe("use()", function() {
    it("should indicate success if a valid token was provided", async function() {
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
        .post(testRoute)
        .set("Authorization", `Bearer ${jwt}`)
        .send({
          baseAssetName: "BTC",
          quoteAssetName: "USDT",
          probability: 0.6
        });

      expect(response.statusType).to.equal(2);

      // cleanup
      await (await cryptoSymbolDbPromise).c.deleteMany({});
      await (await assetDbPromise).c.deleteMany({});
      await (await userDbPromise).c.deleteMany({});
    });

    it("should return UNAUTHORIZED if Authorization header was not provided", async function() {
      const response = await request(server)
        .post(testRoute)
        .send({
          baseAssetName: "BTC",
          quoteAssetName: "USDT",
          probability: 0.6
        });

      expect(response.status).to.equal(UNAUTHORIZED);
    });

    it("should return BAD_REQUEST if Authorization header was not structured properly", async function() {
      const response = await request(server)
        .post(testRoute)
        .set("Authorization", "I'm not structured properly")
        .send({
          baseAssetName: "BTC",
          quoteAssetName: "USDT",
          probability: 0.6
        });

      expect(response.status).to.equal(BAD_REQUEST);
    });

    it("should return BAD_REQUEST if an invalid token was provided", async function() {
      const response = await request(server)
        .post(testRoute)
        .set("Authorization", "Bearer I'm-not-a-token")
        .send({
          baseAssetName: "BTC",
          quoteAssetName: "USDT",
          probability: 0.6
        });

      expect(response.status).to.equal(BAD_REQUEST);
    });
  });
});
