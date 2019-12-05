import { CryptoSymbol } from "./cryptoSymbol";

/**
 * An event that's fired when a probability for a cryptocurrency's value is going to rise/fall
 * with a certain probability.
 */
export class SymbolEvent {
  /**
   * The probability threshold that was passed and caused this event to be fired.
   */
  public readonly probability: number;

  /**
   * The symbol associated with this event. It has a [[probability]] to rise/fall in the near future.
   */
  public readonly cryptoSymbol: CryptoSymbol;

  /**
   * Constructs an event to be fired.
   *
   * @param probability The probability threshold that was passed and caused this event to be fired.
   * @param cryptoSymbol  The symbol associated with this event.
   */
  constructor(probability: number, cryptoSymbol: CryptoSymbol) {
    this.probability = probability;
    this.cryptoSymbol = cryptoSymbol;
  }
}
