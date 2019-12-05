import { Asset } from "./asset";

/**
 * A cryptocurrency symbol. These are the entities for which trades happen.
 *
 * A symbol is a valuation of a base asset against a quote asset. So a symbol has a
 * value of <img src="https://latex.codecogs.com/svg.latex?\frac{quote\;asset}{base\;asset}" title="Quote asset divided by base asset" />. For example, BTCUSDT.
 */
export class CryptoSymbol {
  /**
   * The base asset of the symbol.
   */
  public readonly baseAsset: Asset;

  /**
   * The quote asset of the symbol.
   *
   * @default USDT
   */
  public readonly quoteAsset: Asset;

  /**
   * This object maps a user to their threshold probability to be notified if this symbol rises/falls over this probability.
   */
  public preferences: { [userId: string]: number };

  /**
   * Constructs a new crypto symbol object.
   *
   * @param baseAsset The base asset of the symbol.
   * @param quoteAsset The quote asset of the symbol.
   */
  constructor(
    baseAsset: Asset,
    quoteAsset: Asset = new Asset("USDT"),
    preferences?: { [userId: string]: number }
  ) {
    this.baseAsset = baseAsset;
    this.quoteAsset = quoteAsset;
    if (preferences) {
      this.preferences = preferences;
    } else {
      this.preferences = {};
    }
  }
}
