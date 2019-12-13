import { Chance } from "./../../models/chance";
import { suite, describe, it } from "mocha";
import * as config from "config";
import * as lolex from "lolex";
import { expect } from "chai";

suite("Chance", function(): void {
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

    it("should not emit an event when a new probability is given but a new threshold is not reached", function(done: Mocha.Done): void {
      setTimeout(done, 20);
      const chance = new Chance();
      chance.addProbability(0.1);
      chance.on(config.get("chanceEventName"), () => {
        done("symbolEvent was thrown");
      });
      chance.addProbability(0.001);
    });
  });

  describe("decayPeriod", function(): void {
    let clock;
    this.beforeEach(function(): void {
      clock = lolex.install();
    });

    this.afterEach(function(): void {
      clock.uninstall();
    });

    it("should decrease the probability as time goes on", function(): void {
      const chance = new Chance();
      chance.addProbability(1);
      for (let i = 0; i < 5; i++) {
        let lastProbability = chance.probability;
        clock.tick("24:00:00");
        let newProbability = chance.probability;
        expect(newProbability).to.be.lessThan(lastProbability);
      }
    });
  });
});
