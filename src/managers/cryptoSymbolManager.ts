import { CryptoSymbol, cryptoSymbolDbPromise } from "../models/cryptoSymbol";
import { assetDbPromise, Asset } from "../models/asset";
import { validateOrReject } from "class-validator";
import { CryptoSymbolInfo } from "../models/cryptoSymbolInfo";

/**
 * A singleton class that holds all crypto symbols at run time.
 */
class CryptoSymbolManager {
  /**
   * Maps a string representing a symbol (e.g. "BTCUSDT") to the actual crypto symbol object.
   */
  private _cryptoSymbols: Map<string, CryptoSymbol>;

  /**
   * @returns The a map that maps a string representing a symbol (e.g. "BTCUSDT") to the actual crypto symbol object.
   */
  public get cryptoSymbols(): Map<string, CryptoSymbol> {
    return this._cryptoSymbols;
  }

  /**
   * Populates the manager from db. Should be called at the start of the application.
   */
  public async populate() {
    this._cryptoSymbols = new Map<string, CryptoSymbol>();
    const cryptoSymbolDb = await cryptoSymbolDbPromise;

    for await (const cryptoSymbol of cryptoSymbolDb.find()) {
      await cryptoSymbol.cryptoSymbolInfo.populate();
      cryptoSymbol.start();
      this._cryptoSymbols.set(
        cryptoSymbol.cryptoSymbolInfo.baseAsset.name +
          cryptoSymbol.cryptoSymbolInfo.quoteAsset.name,
        cryptoSymbol
      );
    }
  }

  /**
   * Given a base asset's name and a quote asset's name, returns its corresponding CryptoSymbol object.
   * @param baseAssetName The name of the base asset.
   * @param quoteAssetName The name of the quote asset.
   * @throws [ValidationError](https://github.com/typestack/class-validator#validation-errors)[] If either of the assets is not valid.
   */
  public async getCryptoSymbol(
    baseAssetName: string,
    quoteAssetName: string
  ): Promise<CryptoSymbol> {
    const assetString = baseAssetName + quoteAssetName;
    if (this._cryptoSymbols.has(assetString)) {
      return this._cryptoSymbols.get(assetString);
    }

    // crypto symbol not found, we'll need to create it
    const assetDb = await assetDbPromise;
    let baseAsset: Asset;
    let quoteAsset: Asset;
    [baseAsset, quoteAsset] = await Promise.all([
      assetDb.findOne({ name: baseAssetName }),
      assetDb.findOne({ name: quoteAssetName })
    ]);

    if (!baseAsset) {
      baseAsset = new Asset(baseAssetName);
      await validateOrReject(baseAsset);
      await assetDb.insert(baseAsset);
    }

    if (!quoteAsset) {
      quoteAsset = new Asset(quoteAssetName);
      await validateOrReject(quoteAsset);
      await assetDb.insert(quoteAsset);
    }

    const cryptoSymbol = new CryptoSymbol(
      new CryptoSymbolInfo(baseAsset, quoteAsset)
    );
    cryptoSymbol.start();

    (await cryptoSymbolDbPromise).insert(cryptoSymbol);
    this._cryptoSymbols.set(assetString, cryptoSymbol);
    return cryptoSymbol;
  }
}

const cryptoSymbolManager = new CryptoSymbolManager();
export default cryptoSymbolManager;
