import { CryptoSymbolInfo } from "./cryptoSymbolInfo";

/**
 * An event that's fired when a probability for a cryptocurrency's value is going to rise/fall
 * with a certain probability.
 *
 * @event
 */
export class SymbolEvent {
  /**
   * The probability threshold that was passed and caused this event to be fired.
   */
  public readonly probability: number;

  /**
   * The symbol associated with this event. It has a [[probability]] to rise/fall in the near future.
   */
  public readonly cryptoSymbolInfo: CryptoSymbolInfo;

  /**
   * Constructs an event to be fired.
   *
   * @param probability The probability threshold that was passed and caused this event to be fired.
   * @param cryptoSymbolInfo  The symbol associated with this event.
   */
  constructor(probability: number, cryptoSymbolInfo: CryptoSymbolInfo) {
    this.probability = probability;
    this.cryptoSymbolInfo = cryptoSymbolInfo;
  }
}
