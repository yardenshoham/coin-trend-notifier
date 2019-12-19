import { ObjectId } from "mongodb";
import { ref, objectId } from "@yardenshoham/mongodb-typescript";
import { Asset, assetDbPromise } from "./asset";

/**
 * A cryptocurrency symbol. These are the entities for which trades happen.
 *
 * A symbol is a valuation of a base asset against a quote asset. So a symbol has a
 * value of <img src="https://latex.codecogs.com/svg.latex?\frac{quote\;asset}{base\;asset}" title="Quote asset divided by base asset" />. For example, BTCUSDT.
 */
export class CryptoSymbolInfo {
  /**
   * The id of the base asset of the symbol.
   */
  @objectId
  private baseAssetId: ObjectId;

  /**
   * The id of the quote asset of the symbol.
   */
  @objectId
  private quoteAssetId: ObjectId;

  /**
   * The base asset of the symbol.
   */
  @ref()
  public baseAsset: Asset;

  /**
   * The quote asset of the symbol.
   */
  @ref()
  public quoteAsset: Asset;

  /**
   * This object maps a user to their threshold probability to be notified if this symbol rises/falls over this probability.
   */
  public preferences: Map<string | ObjectId, number>;

  /**
   * Constructs a new crypto symbol object.
   *
   * @param baseAsset The base asset of the symbol.
   * @param quoteAsset The quote asset of the symbol.
   */
  constructor(
    baseAsset: Asset,
    quoteAsset: Asset,
    preferences?: Map<string | ObjectId, number>
  ) {
    this.baseAsset = baseAsset;
    this.quoteAsset = quoteAsset;
    if (preferences) {
      this.preferences = preferences;
    } else {
      this.preferences = new Map<string | ObjectId, number>();
    }
  }

  /**
   * Populates this crypto symbol info with the appropriate assets.
   */
  public async populate() {
    const assetDb = await assetDbPromise;
    const [baseAsset, quoteAsset] = await Promise.all([
      assetDb.findById(this.baseAssetId),
      assetDb.findById(this.quoteAssetId)
    ]);
    this.baseAsset = baseAsset;
    this.quoteAsset = quoteAsset;
  }
}
