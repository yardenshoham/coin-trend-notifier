import { EventEmitter } from "events";

/**
 * Represents a chance or probability that a certain symbol's value will rise/fall in the near future.
 */
export class Chance extends EventEmitter {
  /**
   * The period of time (in seconds) for the probability to go from 1 or -1 to 0 with no external intervention.
   *
   * @default 1209600 Two weeks.
   */
  private _decayPeriod: number;

  /**
   * The code returned by setInterval to clear when a new [[decayPeriod]] is set.
   */
  private _decayPeriodClearCode: number;

  /**
   * The "probability" an asset will rise/fall.
   *
   * 1 means the symbol's value will 100% rise. -1 means the symbol's value will 100% fall. 0 means there will be
   * no change in the symbol's value in the near future.
   */
  private _probability: number = 0;

  /**
   * Constructs a new chance object, given an optional decay period.
   *
   * @param decayPeriod The [[decayPeriod]] of this Chance object.
   */
  constructor(decayPeriod: number = 1209600) {
    super();

    this._decayPeriod = decayPeriod;
  }

  /**
   * Sets a decay period.
   *
   * It clears the the previous setInterval and calls a new one with the appropriate time interval.
   * @param value The new decay period.
   */
  public set decayPeriod(value: number) {
    this._decayPeriod = value;
    if (this._decayPeriodClearCode) {
      clearInterval(this._decayPeriodClearCode);
    }
    setInterval(this.decreaseProbability, this._decayPeriod);
  }

  /**
   * Takes [[decayPeriod]] 0.1 closer to 0 every time it is called. Should be called a every [[decayPeriod]] / 1000 seconds.
   */
  private decreaseProbability(): void {
    if (this._probability !== 0) {
      this._probability =
        this._probability > 0
          ? this._probability - 0.1
          : this._probability + 0.1;
    }
  }
}
