import { Chance } from "./../../models/chance";
import { suite, describe, it } from "mocha";
import * as config from "config";

suite("Chance suite", function(): void {
  describe("addProbability()", function(): void {
    it("should emit an event when a probability reaches a new threshold", function(done: Mocha.Done): void {
      this.timeout(100);
      const chance = new Chance();
      chance.on(config.get("chanceEventName"), () => {
        done();
      });
      chance.addProbability(1);
    });

    it("should not emit an event when no probability is given", function(done: Mocha.Done): void {
      setTimeout(done, 20);
      const chance = new Chance();
      chance.on(config.get("chanceEventName"), () => {
        done("symbolEvent was thrown");
      });
    });
  });
});
