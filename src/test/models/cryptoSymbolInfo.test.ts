import { CryptoSymbolInfo } from "../../models/cryptoSymbolInfo";
import { suite, describe, it } from "mocha";
import { expect } from "chai";
import { Asset, assetDbPromise } from "../../models/asset";
import { CryptoSymbol, cryptoSymbolDbPromise } from "../../models/cryptoSymbol";
import { ObjectId } from "mongodb";

suite("CryptoSymbolInfo", function (): void {
  describe("constructor", function (): void {
    it("should be given a base asset and a quote and assign them", function (): void {
      const base = "ABC";
      const quote = "DEF";
      const cryptoSymbolInfo = new CryptoSymbolInfo(
        new Asset(base),
        new Asset(quote)
      );
      expect(cryptoSymbolInfo.baseAsset.name).to.equal(base);
      expect(cryptoSymbolInfo.quoteAsset.name).to.equal(quote);
    });

    it("should be optionally given preferences and assign them", function (): void {
      const preferences = new Map([
        [new ObjectId().toHexString(), 0.4],
        [new ObjectId().toHexString(), -0.6],
      ]);

      const cryptoSymbolInfo = new CryptoSymbolInfo(
        new Asset("ABC"),
        new Asset("DEF"),
        preferences
      );
      expect(cryptoSymbolInfo.preferences).to.equal(preferences);
    });
  });

  describe("populate()", function () {
    it("should populate a crypto symbol info's base asset and quote asset", async function () {
      const assetDb = await assetDbPromise;
      const cryptoSymbolDb = await cryptoSymbolDbPromise;

      // prepare assets
      const baseAsset = new Asset("ABC");
      const quoteAsset = new Asset("DEF");
      await Promise.all([
        assetDb.insert(baseAsset),
        assetDb.insert(quoteAsset),
      ]);

      // create crypto symbol info
      const before = new CryptoSymbolInfo(baseAsset, quoteAsset);

      // insert into db
      await cryptoSymbolDb.insert(new CryptoSymbol(before));

      // get from db
      const after = (await cryptoSymbolDb.findOne({})).cryptoSymbolInfo;

      // populate with assets
      await after.populate();

      // cleanup
      assetDb.c.deleteMany({});
      cryptoSymbolDb.c.deleteMany({});

      expect(after.baseAsset).to.have.property("name", baseAsset.name);
      expect(after.quoteAsset).to.have.property("name", quoteAsset.name);
    });

    it("should make sure the hydrated object's preferences is an ES6 Map type", async function () {
      const assetDb = await assetDbPromise;
      const cryptoSymbolDb = await cryptoSymbolDbPromise;

      // prepare assets
      const baseAsset = new Asset("ABC");
      const quoteAsset = new Asset("DEF");
      await Promise.all([
        assetDb.insert(baseAsset),
        assetDb.insert(quoteAsset),
      ]);

      // create crypto symbol info
      const before = new CryptoSymbolInfo(baseAsset, quoteAsset);

      // add preferences
      before.preferences.set("5e19bb04bed2e852c07554e4", 0.4);

      // insert into db
      await cryptoSymbolDb.insert(new CryptoSymbol(before));

      // get from db
      const after = (await cryptoSymbolDb.findOne({})).cryptoSymbolInfo;

      // populate with assets
      await after.populate();

      // cleanup
      assetDb.c.deleteMany({});
      cryptoSymbolDb.c.deleteMany({});

      expect(after.preferences).to.have.property("has");
    });
  });
});
