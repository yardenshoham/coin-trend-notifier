import { CryptoSymbol } from "../../../models/cryptoSymbol";
import { suite, describe, it } from "mocha";
import { CryptoSymbolInfo } from "../../../models/cryptoSymbolInfo";
import { Asset } from "../../../models/asset";
import { Chance } from "../../../models/chance";
import * as config from "config";
import { SymbolEvent } from "../../../models/symbolEvent";

suite("CryptoSymbol", function(): void {
  describe("event handling", function(): void {
    it("should fire a SymbolEvent when Chance fires an event", function(done: Mocha.Done): void {
      const chance = new Chance();
      const cryptoSymbol = new CryptoSymbol(
        new CryptoSymbolInfo(new Asset("ABC")),
        chance
      );
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
  });
});
