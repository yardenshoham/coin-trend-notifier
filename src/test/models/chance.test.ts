import { Chance } from "./../../models/chance";
import { suite, describe, it } from "mocha";

suite("Chance suite", function(): void {
  describe("addProbability()", function(): void {
    it("should emit a SymbolEvent when a probability reaches a new threshold", function(done: Mocha.Done): void {
      this.timeout(100);
      const chance = new Chance();
      chance.on("symbolEvent", () => {
        done();
      });
      chance.addProbability(1);
    });

    it("should not emit a SymbolEvent when no probability is given", function(done: Mocha.Done): void {
      setTimeout(done, 20);
      const chance = new Chance();
      chance.on("symbolEvent", () => {
        done("symbolEvent was thrown");
      });
    });
  });
});
