import { EventEmitter } from "events";
import config from "config";
import { ignore } from "@yardenshoham/mongodb-typescript";
import { Min, Max } from "class-validator";

/**
 * Represents a chance or probability that a certain symbol's value will rise/fall in the near future.
 */
export class Chance extends EventEmitter {
  /**
   * The period of time (in seconds) for the probability to go from 1 or -1 to 0 with no external intervention. Must be at least 3600 (1 hours).
   *
   * @default 1209600 Two weeks.
   */
  @Min(3600)
  private _decayPeriod: number;

  /**
   * The code returned by setInterval to clear when a new [[decayPeriod]] is set.
   */
  @ignore
  private _decayPeriodClearCode: any;

  /**
   * The "probability" an asset will rise/fall.
   *
   * 1 means the symbol's value will 100% rise. -1 means the symbol's value will 100% fall. 0 means there will be no change in the symbol's value in the near future.
   */
  @Min(-1)
  @Max(1)
  private _probability: number = 0;

  /**
   * Constructs a new chance object, given an optional decay period. [[start]] must be called as part of construction.
   *
   * @param decayPeriod The [[decayPeriod]] of this Chance object.
   */
  constructor(decayPeriod: number = 1209600) {
    super();
    this.removeAllListeners();
    this._decayPeriod = decayPeriod;
  }

  /**
   * Sets a decay period.
   *
   * It clears the the previous setInterval and calls a new one with the appropriate time interval.
   * @param value The new decay period. Must be greater than 1.
   *
   * @throws {RangeError} If value is less than 1.
   */
  public set decayPeriod(value: number) {
    if (value < 1) {
      throw new RangeError("decayPeriod must be grater than 1");
    }
    this._decayPeriod = value;
    if (this._decayPeriodClearCode) {
      clearInterval(this._decayPeriodClearCode);
    }
    this._decayPeriodClearCode = setInterval(
      this.decreaseProbability,
      this._decayPeriod
    );
  }

  /**
   * @returns This chance's current probability.
   */
  public get probability(): number {
    return this._probability;
  }

  /**
   * Takes [[decayPeriod]] 0.001 closer to 0 every time it is called. Should be called a every [[decayPeriod]] / 1000 seconds.
   */
  private decreaseProbability = (): void => {
    if (Math.abs(this._probability) < 0.001) {
      this._probability = 0;
    } else {
      this._probability -= Math.sign(this._probability) * 0.001;
    }
  };

  /**
   * Adds a sample to the the chance's probability.
   *
   * If appropriate, fires an event with the probability information.
   *
   * @emit The actual event with the current probability.
   *
   * @param probability The new probability sample.
   *
   * @throws {RangeError} If the given probability is less than -1 or greater than 1.
   */
  public addProbability(probability: number): void {
    if (probability < -1 || probability > 1) {
      throw new RangeError("probability must be between -1 and 1");
    }

    const oldProbability = this._probability;
    this._probability = (oldProbability + probability) / 2;

    const percentileAmount: number = config.get("percentileAmount");
    const chanceEventName: string = config.get("chanceEventName");

    // we'll need to notify if we've entered a higher percentile
    if (
      Math.floor(Math.abs(this._probability) * percentileAmount) >
      Math.floor(Math.abs(oldProbability) * percentileAmount)
    ) {
      this.emit(chanceEventName, this._probability);
    }
  }

  /**
   * Start automatically decreasing the probability. Must be called after [[constructor]].
   */
  public start() {
    this.decayPeriod = this._decayPeriod;
  }
}
