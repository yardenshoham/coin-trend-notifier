import { suite, describe, it } from "mocha";
import { expect } from "chai";
import { Asset, assetDbPromise } from "../../models/asset";
import {
  CryptoSymbol,
  cryptoSymbolDbPromise
} from "./../../models/cryptoSymbol";
import { CryptoSymbolInfo } from "../../models/cryptoSymbolInfo";
import cryptoSymbolManager from "./../../managers/cryptoSymbolManager";

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
});
