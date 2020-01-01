import { suite, describe, it } from "mocha";
import chai, { expect } from "chai";
import { Asset, assetDbPromise } from "../../models/asset";
import {
  CryptoSymbol,
  cryptoSymbolDbPromise
} from "./../../models/cryptoSymbol";
import { CryptoSymbolInfo } from "../../models/cryptoSymbolInfo";
import cryptoSymbolManagerPromise from "./../../managers/cryptoSymbolManager";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);

suite("CryptoSymbolManager", function() {
  describe("populate()", function() {
    it("should populate the manager with all crypto symbols from the db", async function() {
      const baseAssets = [new Asset("ABC"), new Asset("DEF"), new Asset("GHI")];
      const quoteAssets = [
        new Asset("JKL"),
        new Asset("MNO"),
        new Asset("PQR")
      ];

      const assetDb = await assetDbPromise;
      await Promise.all([
        ...baseAssets.map(asset => assetDb.insert(asset)),
        ...quoteAssets.map(asset => assetDb.insert(asset))
      ]);

      const cryptoSymbols = [];
      for (let i = 0; i < baseAssets.length; i++) {
        cryptoSymbols.push(
          new CryptoSymbol(new CryptoSymbolInfo(baseAssets[i], quoteAssets[i]))
        );
      }

      const cryptoSymbolDb = await cryptoSymbolDbPromise;
      await Promise.all(
        cryptoSymbols.map(cryptoSymbol => cryptoSymbolDb.insert(cryptoSymbol))
      );

      const cryptoSymbolManager = await cryptoSymbolManagerPromise;
      await cryptoSymbolManager.populate();

      expect(cryptoSymbolManager.cryptoSymbols.size).to.equal(
        baseAssets.length
      );

      const baseAssetIds = baseAssets.map(a => a._id.toHexString());
      const quoteAssetIds = quoteAssets.map(a => a._id.toHexString());
      for (const cryptoSymbol of cryptoSymbolManager.cryptoSymbols.values()) {
        expect(baseAssetIds).to.include(
          cryptoSymbol.cryptoSymbolInfo.baseAsset._id.toHexString()
        );
        expect(quoteAssetIds).to.include(
          cryptoSymbol.cryptoSymbolInfo.quoteAsset._id.toHexString()
        );
      }

      await cryptoSymbolDb.c.deleteMany({});
      return assetDb.c.deleteMany({});
    });
  });

  describe("getCryptoSymbol()", function() {
    it("should return a crypto symbol given its corresponding base and quote asset when the assets do not exist and save the assets", async function() {
      const baseAssetName = "ABC";
      const quoteAssetName = "DEF";

      const cryptoSymbolManager = await cryptoSymbolManagerPromise;
      const cryptoSymbol = await cryptoSymbolManager.getCryptoSymbol(
        baseAssetName,
        quoteAssetName
      );

      expect(cryptoSymbol.cryptoSymbolInfo.baseAsset).to.have.property(
        "name",
        baseAssetName
      );
      expect(cryptoSymbol.cryptoSymbolInfo.quoteAsset).to.have.property(
        "name",
        quoteAssetName
      );

      const assetDb = await assetDbPromise;

      await Promise.all([
        expect(assetDb.findOne({ name: baseAssetName })).to.be.fulfilled,
        expect(assetDb.findOne({ name: quoteAssetName })).to.be.fulfilled
      ]);

      const cryptoSymbolDb = await cryptoSymbolDbPromise;
      expect(await cryptoSymbolDb.count()).to.equal(1);

      await cryptoSymbolDb.c.deleteMany({});
      return assetDb.c.deleteMany({});
    });

    it("should return a crypto symbol given its corresponding base and quote asset when the crypto symbol exists", async function() {
      const baseAssetName = "ABC";
      const quoteAssetName = "DEF";

      const assetDb = await assetDbPromise;
      const baseAsset = new Asset(baseAssetName);
      const quoteAsset = new Asset(quoteAssetName);
      await Promise.all([
        assetDb.insert(baseAsset),
        assetDb.insert(quoteAsset)
      ]);

      const cryptoSymbolDb = await cryptoSymbolDbPromise;

      expect(await cryptoSymbolDb.count()).to.equal(0);

      await cryptoSymbolDb.insert(
        new CryptoSymbol(new CryptoSymbolInfo(baseAsset, quoteAsset))
      );

      expect(await cryptoSymbolDb.count()).to.equal(1);

      const cryptoSymbolManager = await cryptoSymbolManagerPromise;

      // let the manager know of external db changes
      await cryptoSymbolManager.populate();

      const cryptoSymbol = await cryptoSymbolManager.getCryptoSymbol(
        baseAssetName,
        quoteAssetName
      );

      expect(await cryptoSymbolDb.count()).to.equal(1);

      expect(cryptoSymbol.cryptoSymbolInfo.baseAsset).to.have.property(
        "name",
        baseAssetName
      );
      expect(cryptoSymbol.cryptoSymbolInfo.quoteAsset).to.have.property(
        "name",
        quoteAssetName
      );

      (await cryptoSymbolDbPromise).c.deleteMany({});
      return assetDb.c.deleteMany({});
    });
  });
});
