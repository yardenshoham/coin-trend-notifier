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
   * Constructs a new crypto symbol object.
   *
   * @param baseAsset The base asset of the symbol.
   * @param quoteAsset The quote asset of the symbol.
   */
  constructor(baseAsset: Asset, quoteAsset: Asset = new Asset("USDT")) {
    this.baseAsset = baseAsset;
    this.quoteAsset = quoteAsset;
  }
}
