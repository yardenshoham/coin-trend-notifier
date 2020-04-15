import providerManager from "./../managers/providerManager";
import twitterProvider from "./../providers/twitterProvider";
import binanceProvider from "./../providers/binanceProvider";

export default () => {
  providerManager.register(twitterProvider);
  providerManager.register(binanceProvider);
};
