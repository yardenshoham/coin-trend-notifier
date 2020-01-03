import providerManager from "./../managers/providerManager";
import twitterProvider from "./../providers/twitterProvider";

export default () => {
  providerManager.register(twitterProvider);
};
