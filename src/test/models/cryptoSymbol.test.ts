import { CryptoSymbol } from "../../models/cryptoSymbol";
import { suite, describe, it } from "mocha";
import { CryptoSymbolInfo } from "../../models/cryptoSymbolInfo";
import { Asset } from "../../models/asset";
import { Chance } from "../../models/chance";
import * as config from "config";
import { SymbolEvent } from "../../models/symbolEvent";
import { expect } from "chai";

suite("CryptoSymbol", function(): void {
  describe("event handling", function(): void {
    it("should fire a SymbolEvent when Chance fires an event", function(done: Mocha.Done): void {
      const chance = new Chance();
      const cryptoSymbol = new CryptoSymbol(
        new CryptoSymbolInfo(new Asset("ABC"), new Asset("DEF")),
        chance
      );
      cryptoSymbol.start();
      cryptoSymbol.on(
        config.get("cryptoSymbolEventName"),
        (symbolEvent: SymbolEvent): void => {
          if (symbolEvent) {
            done();
          } else {
            done("No SymbolEvent");
          }
        }
      );
      chance.emit(config.get("chanceEventName"));
    });

    it("should fire a SymbolEvent with the appropriate probability and CryptoSymbolInfo when a (threshold-passing) probability sample is added", function(): void {
      const cryptoSymbolInfo = new CryptoSymbolInfo(
        new Asset("ABC"),
        new Asset("DEF")
      );
      const cryptoSymbol = new CryptoSymbol(cryptoSymbolInfo);
      cryptoSymbol.start();
      let called = false;
      cryptoSymbol.on(
        config.get("cryptoSymbolEventName"),
        (symbolEvent: SymbolEvent): void => {
          expect(called).to.be.false;
          expect(symbolEvent.cryptoSymbolInfo).to.equal(cryptoSymbolInfo);
          expect(symbolEvent).to.have.property("probability");
          called = true;
        }
      );
      cryptoSymbol.addProbability(1);
      cryptoSymbol.addProbability(0.01);
    });
  });
});
