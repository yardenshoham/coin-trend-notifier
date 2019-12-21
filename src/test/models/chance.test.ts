import { Chance } from "../../models/chance";
import { suite, describe, it } from "mocha";
import config from "config";
import lolex from "lolex";
import { expect } from "chai";

suite("Chance", function(): void {
  describe("addProbability()", function(): void {
    it("should emit an event when a probability reaches a new threshold", function(done: Mocha.Done): void {
      this.timeout(100);
      const chance = new Chance();
      chance.start();
      chance.on(config.get("chanceEventName"), () => {
        done();
      });
      chance.addProbability(1);
    });

    it("should not emit an event when no probability is given", function(done: Mocha.Done): void {
      setTimeout(done, 20);
      const chance = new Chance();
      chance.start();
      chance.on(config.get("chanceEventName"), () => {
        done("symbolEvent was thrown");
      });
    });

    it("should not emit an event when a new probability is given but a new threshold is not reached", function(done: Mocha.Done): void {
      setTimeout(done, 20);
      const chance = new Chance();
      chance.start();
      chance.addProbability(0.1);
      chance.on(config.get("chanceEventName"), () => {
        done("symbolEvent was thrown");
      });
      chance.addProbability(0.001);
    });

    it("should accept legal values (between -1 and 1)", function(): void {
      const legalValues = [
        0.45,
        -0.777,
        0.3998,
        0.9999,
        1,
        -0.87,
        -0.321,
        -0.4,
        0,
        -1
      ];
      const chance = new Chance();
      chance.start();
      for (const value of legalValues) {
        expect(() => {
          chance.addProbability(value);
        }, `value: ${value}`).not.to.throw();
      }
    });

    it("should not accept illegal values (less than -1 or greater than 1)", function(): void {
      const illegalValues = [4, 9, 1.8, -8, -16, 45.76, -90, 111111, -544576];
      const chance = new Chance();
      chance.start();
      for (const value of illegalValues) {
        expect(() => {
          chance.addProbability(value);
        }, `value: ${value}`).to.throw();
      }
    });
  });

  describe("decayPeriod", function(): void {
    let clock: lolex.InstalledClock;
    this.beforeEach(function(): void {
      clock = lolex.install();
    });

    this.afterEach(function(): void {
      clock.uninstall();
    });

    it("should decrease the probability as time goes on", function(): void {
      const chance = new Chance();
      chance.start();
      chance.addProbability(1);
      for (let i = 0; i < 5; i++) {
        let lastProbability = chance.probability;
        clock.tick("24:00:00");
        let newProbability = chance.probability;
        expect(newProbability).to.be.lessThan(lastProbability);
      }
    });

    it("should make sure that, given a long time, the probability goes to 0", function(): void {
      const chance = new Chance();
      chance.start();
      chance.addProbability(1);
      // 6 months
      for (let i = 0; i < 6 * 30; i++) {
        clock.tick("24:00:00");
      }
      expect(chance.probability).to.equal(0);
      chance.addProbability(-1);
      // 6 months
      for (let i = 0; i < 6 * 30; i++) {
        clock.tick("24:00:00");
      }
      expect(chance.probability).to.equal(0);
    });

    it("should be set with the value given to the constructor", function(): void {
      const chance = new Chance(1000);
      chance.start();
      chance.addProbability(1);
      clock.tick(501 * 1000);
      expect(chance.probability).to.equal(0);
    });

    it("should change when being set to a different value", function(): void {
      const chance = new Chance();
      chance.start();
      chance.decayPeriod = 8000;
      chance.addProbability(1);
      clock.tick(3999 * 1000);
      expect(chance.probability).not.to.equal(0);
      clock.tick(2000);
      expect(chance.probability).to.equal(0);
      chance.decayPeriod = 40000;
      chance.addProbability(1);
      clock.tick(19999 * 1000);
      expect(chance.probability).not.to.equal(0);
      clock.tick(2000);
      expect(chance.probability).to.equal(0);
    });

    it("should accept legal values (greater or equal to 1)", function(): void {
      const legalValues = [1, 400, 1.26, 11, 89.4, 1.1, 1000, 40 ** 3, 44];
      const chance = new Chance();
      chance.start();
      for (const value of legalValues) {
        expect(() => {
          chance.decayPeriod = value;
        }, `value: ${value}`).not.to.throw();
      }
    });

    it("should not accept illegal values (less than 1)", function(): void {
      const illegalValues = [-7, 0, 0.4, -12, -100, -50.23, 0.002, -0.4];
      const chance = new Chance();
      chance.start();
      for (const value of illegalValues) {
        expect(() => {
          chance.decayPeriod = value;
        }, `value: ${value}`).to.throw();
      }
    });
  });
});
