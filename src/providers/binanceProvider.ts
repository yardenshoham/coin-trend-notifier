import Provider from "../interfaces/provider";
import config from "config";
import cryptoSymbolManagerPromise from "./../managers/cryptoSymbolManager";
import Binance from "binance-api-node";

class BinanceProvider implements Provider {
  private client;
  private interval: number;

  start() {
    this.client = Binance();
    this.interval = config.get("binancePeriodicTaskInterval");
    setInterval(this.periodicTask, this.interval);
  }

  async periodicTask() {
    const cryptoSymbolIterator = (
      await cryptoSymbolManagerPromise
    ).cryptoSymbols.values();

    for (const cryptoSymbol of cryptoSymbolIterator) {
      const symbolString =
        cryptoSymbol.cryptoSymbolInfo.baseAsset.name +
        cryptoSymbol.cryptoSymbolInfo.quoteAsset.name;

      await this.client.candles({
        symbol: symbolString,
        interval: `${Math.floor(this.interval / 3600000).toString()}h`
      });
    }
  }
}

export default new BinanceProvider();
