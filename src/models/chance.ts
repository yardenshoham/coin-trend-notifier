import { EventEmitter } from "events";
import * as config from "config";

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
  private _decayPeriodClearCode: NodeJS.Timeout;

  /**
   * The "probability" an asset will rise/fall.
   *
   * 1 means the symbol's value will 100% rise. -1 means the symbol's value will 100% fall. 0 means there will be no change in the symbol's value in the near future.
   */
  private _probability: number = 0;

  /**
   * Constructs a new chance object, given an optional decay period.
   *
   * @param decayPeriod The [[decayPeriod]] of this Chance object.
   */
  constructor(decayPeriod: number = 1209600) {
    super();

    this.decayPeriod = decayPeriod;
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
   * Takes [[decayPeriod]] 0.1 closer to 0 every time it is called. Should be called a every [[decayPeriod]] / 1000 seconds.
   */
  private decreaseProbability(): void {
    this._probability -= Math.sign(this._probability) * 0.1;
  }

  /**
   * Sets the chance's probability.
   *
   * If appropriate, fires a [[SymbolEvent]] with the probability information.
   *
   * @emit SymbolEvent The actual event with all relevant information.
   *
   * @param probability The new probability sample.
   */
  public addProbability(probability: number) {
    if (probability < -1 || probability > 1) {
      console.log("value must be between -1 and 1");
      return;
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
}
