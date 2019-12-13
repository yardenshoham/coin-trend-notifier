import { SymbolEvent } from "./../../models/symbolEvent";
import { suite, describe, it } from "mocha";
import { expect } from "chai";
import { CryptoSymbolInfo } from "./../../models/cryptoSymbolInfo";
import { Asset } from "../../models/asset";

suite("SymbolEvent", function(): void {
  describe("constructor", function(): void {
    it("should be given a probability and a CryptoSymbolInfo object and assign them", function(): void {
      const probability = 0.47;
      const cryptoSymbolInfo = new CryptoSymbolInfo(
        new Asset("ABC"),
        new Asset("DEF")
      );
      const symbolEvent = new SymbolEvent(probability, cryptoSymbolInfo);
      expect(symbolEvent.probability).to.equal(probability);
      expect(symbolEvent.cryptoSymbolInfo).to.equal(cryptoSymbolInfo);
    });
  });
});
