import { EventEmitter } from "events";
import { Chance } from "./chance";
import { CryptoSymbolInfo } from "./cryptoSymbolInfo";
import * as config from "config";
import { SymbolEvent } from "./symbolEvent";

/**
 * A class to link a crypto symbol's info to its current chance.
 */
export class CryptoSymbol extends EventEmitter {
  /**
   * The information about this crypto symbol (assets, followers etc...).
   */
  public readonly cryptoSymbolInfo: CryptoSymbolInfo;

  /**
   * This crypto symbol's current chance to rise/fall.
   */
  public readonly chance: Chance;

  /**
   * Constructs a new crypto symbol.
   *
   * @param cryptoSymbolInfo The information for this crypto symbol.
   * @param chance The chance this crypto symbol will rise/fall. Should not be passed with the creation of a new crypto symbol, unless the chance requires a different decay period from the default one.
   */
  constructor(cryptoSymbolInfo: CryptoSymbolInfo, chance?: Chance) {
    super();

    this.cryptoSymbolInfo = cryptoSymbolInfo;
    this.chance = chance ? chance : new Chance();

    // catch the event, add info to it then fire the complete event
    this.chance.on(
      config.get("chanceEventName"),
      (probability: number): void => {
        this.emit(
          config.get("cryptoSymbolEventName"),
          new SymbolEvent(probability, this.cryptoSymbolInfo)
        );
      }
    );
  }

  /**
   * Adds a sample to the crypto symbol chance's probability.
   *
   * If appropriate, fires a [[SymbolEvent]] with the probability and symbol information.
   *
   * @emit The actual event with the current probability and CryptoSymbolInfo object.
   *
   * @param probability The new probability sample.
   *
   * @throws {RangeError} If the given probability is less than -1 or greater than 1.
   */
  public addProbability(probability: number): void {
    return this.chance.addProbability(probability);
  }
}
