import Provider from "../interfaces/provider";
import config from "config";
import cryptoSymbolManagerPromise from "./../managers/cryptoSymbolManager";
import Binance from "binance-api-node";
import { CryptoSymbol } from "./../models/cryptoSymbol";
/* istanbul ignore next */

/**
 * Uses the Binance API to predict trends.
 */
class BinanceProvider implements Provider {
  /**
   * The Binance api client.
   */
  private client;

  /**
   * The amount of milliseconds between each [[periodicTask]].
   */
  private interval: number;

  /**
   * The string representing the candle length in hours.
   */
  private intervalHourString: string;

  /**
   * Initializes members and sets interval.
   */
  start = () => {
    this.client = Binance();
    console.log("Connected to Binance.");
    this.periodicTask();
    this.interval = config.get("binancePeriodicTaskInterval");
    this.intervalHourString = Math.floor(this.interval / 3600000).toString();
    setInterval(this.periodicTask, this.interval);
  };

  /**
   * Implements the following algorithm.
   * ![Algorithm](https://user-images.githubusercontent.com/20454870/72290021-00b1e500-3655-11ea-8d32-b0f6bfc09f3d.png)
   */
  periodicTask = async () => {
    const cryptoSymbolIterator = (
      await cryptoSymbolManagerPromise
    ).cryptoSymbols.values();

    return Promise.all(
      Array.from(cryptoSymbolIterator).map(this.analyzeSymbol)
    );
  };

  /**
   * Calculates the minimum and maximum value  for a given array of candles.
   * @param candles The candles for the current symbol.
   */
  private calculateMinMax = (candles: any[]): [number, number] => {
    let max = 0;
    let min = Number.MAX_SAFE_INTEGER;
    candles.forEach((candle) => {
      if (candle.high > max) {
        max = candle.high;
      }
      if (candle.low < min) {
        min = candle.low;
      }
    });

    return [min, max];
  };

  /**
   * Retrieves candles for a given symbol.
   * @param symbolString The symbol to fetch the candles for.
   */
  private fetchCandles = async (symbolString: string) => {
    const candles: any[] = await this.client.candles({
      symbol: symbolString,
      interval: `${this.intervalHourString}h`,
      limit: 56,
    });

    return candles.map((candle) => {
      candle.high = parseFloat(candle.high);
      candle.close = parseFloat(candle.close);
      candle.low = parseFloat(candle.low);
      return candle;
    });
  };

  /**
   * Analyzes recent symbol data and in turn updates its probability.
   * @param cryptoSymbol The symbol for which we'll update the probability.
   */
  private analyzeSymbol = async (cryptoSymbol: CryptoSymbol) => {
    const symbolString =
      cryptoSymbol.cryptoSymbolInfo.baseAsset.name +
      cryptoSymbol.cryptoSymbolInfo.quoteAsset.name;

    const candles = await this.fetchCandles(symbolString);

    const [min, max] = this.calculateMinMax(candles);
    const currentPrice = candles.pop().close;
    const normalMax = max - min;
    const normalCurrentPrice = currentPrice - min;
    const priceToMax = normalCurrentPrice / normalMax;

    if (priceToMax >= 0.5) {
      const local = priceToMax - 0.5;
      cryptoSymbol.addProbability(local * -2);
    } else {
      cryptoSymbol.addProbability(1 - priceToMax * 2);
    }
  };
}

export default new BinanceProvider();
