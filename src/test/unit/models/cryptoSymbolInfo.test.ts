import { CryptoSymbolInfo } from "../../../models/cryptoSymbolInfo";
import { suite, describe, it } from "mocha";
import { expect } from "chai";
import { Asset } from "../../../models/asset";

suite("CryptoSymbolInfo", function(): void {
  describe("constructor", function(): void {
    it("should be given a base asset and a quote and assign them", function(): void {
      const base = "ABC";
      const quote = "DEF";
      const cryptoSymbolInfo = new CryptoSymbolInfo(
        new Asset(base),
        new Asset(quote)
      );
      expect(cryptoSymbolInfo.baseAsset.name).to.equal(base);
      expect(cryptoSymbolInfo.quoteAsset.name).to.equal(quote);
    });
  });

  it("should have a default USDT quote asset", function(): void {
    const cryptoSymbolInfo = new CryptoSymbolInfo(new Asset("ABC"));
    expect(cryptoSymbolInfo.quoteAsset.name).to.equal("USDT");
  });

  it("should be optionally given preferences and assign them", function(): void {
    const preferences = {
      "123": 0.4,
      "124": -0.6
    };
    const cryptoSymbolInfo = new CryptoSymbolInfo(
      new Asset("ABC"),
      new Asset("DEF"),
      preferences
    );
    expect(cryptoSymbolInfo.preferences).to.equal(preferences);
  });
});
