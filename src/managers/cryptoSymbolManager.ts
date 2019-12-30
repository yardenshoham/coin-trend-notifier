import { CryptoSymbol, cryptoSymbolDbPromise } from "../models/cryptoSymbol";

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
}

const cryptoSymbolManager = new CryptoSymbolManager();
export default cryptoSymbolManager;
