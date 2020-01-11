import { SymbolEvent, symbolEventDbPromise } from "../../models/symbolEvent";
import { suite, describe, it } from "mocha";
import { expect } from "chai";
import { CryptoSymbolInfo } from "../../models/cryptoSymbolInfo";
import { Asset, assetDbPromise } from "../../models/asset";
import UserDtoIn from "../../dtos/userDtoIn";
import RegisteredUserDto from "../../dtos/registeredUserDto";
import UserService from "./../../services/userService";
import UserJwtPayload from "../../interfaces/userJwtPayload";
import jwt from "jsonwebtoken";
import SetPreferenceDto from "../../dtos/setPreferenceDto";
import PreferenceService from "./../../services/preferenceService";
import cryptoSymbolManagerPromise from "./../../managers/cryptoSymbolManager";
import config from "config";
import { userDbPromise } from "../../models/user";
import { cryptoSymbolDbPromise } from "../../models/cryptoSymbol";

suite("SymbolEvent", function(): void {
  describe("constructor", function(): void {
    it("should be given a probability and a CryptoSymbolInfo object and assign them", function(): void {
      const probability = 0.1;
      const cryptoSymbolInfo = new CryptoSymbolInfo(
        new Asset("ABC"),
        new Asset("DEF")
      );
      const symbolEvent = new SymbolEvent(probability, cryptoSymbolInfo);
      expect(symbolEvent.probability).to.equal(probability);
      expect(symbolEvent.cryptoSymbolInfo).to.equal(cryptoSymbolInfo);
    });
  });

  describe("getSubscribers()", function() {
    it("should return all subscribers of the event", async function() {
      const users: UserDtoIn[] = [
        {
          email: "abcd@gmail.com",
          username: "AB_CD",
          password: "12345",
          alertLimit: 0
        },
        {
          email: "qwert@gmail.com",
          username: "hey",
          password: "qwertyuiop",
          alertLimit: 8888
        },
        {
          email: "aaaa@gmail.com",
          username: "AaaaaD",
          password: "TEST",
          alertLimit: 14598533
        }
      ];

      // register
      const registeredUsers: RegisteredUserDto[] = await Promise.all(
        users.map(user => UserService.signUp(user))
      );

      // login
      const jwts: string[] = await Promise.all(
        registeredUsers.map((user, index) =>
          UserService.login({
            email: user.email,
            password: users[index].password
          })
        )
      );

      const ids: string[] = jwts.map(
        (userJwt): string => (jwt.decode(userJwt) as UserJwtPayload)._id
      );

      const preferences: SetPreferenceDto[] = [
        {
          baseAssetName: "BTC",
          quoteAssetName: "ETH",
          probability: 0.1
        },
        {
          baseAssetName: "BTC",
          quoteAssetName: "ETH",
          probability: 0.5
        },
        {
          baseAssetName: "BTC",
          quoteAssetName: "ETH",
          probability: 0.9
        }
      ];

      // add preferences
      for (const i in preferences) {
        const preference = preferences[i];
        await PreferenceService.setPreference(
          ids[i],
          preference.baseAssetName,
          preference.quoteAssetName,
          preference.probability
        );
      }

      const btceth = await (await cryptoSymbolManagerPromise).getCryptoSymbol(
        "BTC",
        "ETH"
      );

      return new Promise((resolve, _) => {
        // first test, should return the one with 0.1
        btceth.on(
          config.get("cryptoSymbolEventName"),
          async (symbolEvent: SymbolEvent) => {
            const subscribers = symbolEvent.getSubscribers();
            expect(subscribers.length).to.equal(1);
            expect(subscribers[0]).to.equal(ids[0]);

            btceth.removeAllListeners();

            // second test, should return the one with 0.1 and the one with 0.5
            btceth.on(
              config.get("cryptoSymbolEventName"),
              async (symbolEvent: SymbolEvent) => {
                const subscribers = symbolEvent.getSubscribers();
                expect(subscribers.length).to.equal(2);
                expect(subscribers).to.include(ids[0]);
                expect(subscribers).to.include(ids[1]);
                const symbolEventDb = await symbolEventDbPromise;
                expect(await symbolEventDb.count({})).to.equal(2);

                // cleanup
                await (await userDbPromise).c.deleteMany({});
                await (await assetDbPromise).c.deleteMany({});
                await (await cryptoSymbolDbPromise).c.deleteMany({});
                await symbolEventDb.c.deleteMany({});
                resolve();
              }
            );

            btceth.addProbability(0.9);
          }
        );

        btceth.addProbability(0.4);
      });
    });
  });
});
