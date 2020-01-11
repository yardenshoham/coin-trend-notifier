import Provider from "../interfaces/provider";
class BinanceProvider implements Provider {
  start() {
    throw new Error("Method not implemented.");
  }
}

export default new BinanceProvider();
