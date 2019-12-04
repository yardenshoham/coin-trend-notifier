/**
 * Represents a crypto asset.
 *
 * For example: BTC, ETH, USDT...
 */
export class Asset {
  /**
   * The name of the asset. Could be "USDT", "ETH", "BTC" etc...
   */
  public name: string;

  /**
   * Constructs a new crypto asset.
   *
   * @param name The name of the asset. Could be "USDT", "ETH", "BTC" etc...
   */
  constructor(name: string) {
    this.name = name;
  }
}
