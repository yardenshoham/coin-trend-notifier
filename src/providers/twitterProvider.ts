import Provider from "../interfaces/provider";
import Twit from "twit";
import config from "config";
import Sentiment from "sentiment";
import { SentimentAnalyzer } from "node-nlp";
import { Asset } from "./../models/asset";
import cryptoSymbolManagerPromise from "./../managers/cryptoSymbolManager";
/* istanbul ignore next */

/**
 * A class that monitors tweets about cryptocurrency and adds probabilities appropriately.
 */
class TwitterProvider implements Provider {
  /**
   * The api client. https://github.com/ttezel/twit.
   */
  private twit: Twit;

  /**
   * The sentiment analyzer from the "sentiment" package.
   */
  private sentimentClient;

  /**
   * The sentiment analyzer from the "node-nlp" package.
   */
  private nlpClient;

  /**
   * The object used to identify assets.
   *
   * short: A list of possible asset names in shorthand form.
   * longToShort: An object that maps a "full name" of an asset to its short name e.g. BITCOIN --> BTC
   */
  private assetsHelper: { short: object; longToShort: object };

  /**
   * Creates the Twitter api client and sets it to [[twit]].
   */
  private setInstance() {
    this.twit = new Twit({
      consumer_key: config.get("twitterConsumerKey"),
      consumer_secret: config.get("twitterConsumerSecret"),
      access_token: config.get("twitterAccessToken"),
      access_token_secret: config.get("twitterAccessTokenSecret"),
    });
  }

  /**
   * Initializes all sentiment analysis clients.
   */
  private initSentimentAnalysis() {
    this.sentimentClient = new Sentiment();
    this.nlpClient = new SentimentAnalyzer({ language: "en" });
  }

  /**
   * Loads an object with two properties:
   *
   * short: A list of possible asset names in shorthand form.
   * longToShort: An object that maps a "full name" of an asset to its short name e.g. BITCOIN --> BTC
   */
  private loadAssetsHelper() {
    this.assetsHelper = config.get("assetsHelper");
  }

  /**
   * Starts listening to tweets from important cryptocurrency people.
   */
  private async startListening() {
    // get users to follow
    const response = await this.twit.get("friends/ids", {
      screen_name: "trend_notifier",
    });

    // open follow stream
    const stream = this.twit.stream("statuses/filter", {
      follow: (response.data as any).ids,
      tweet_mode: "extended",
    });

    // listen to incoming tweets
    stream.on("tweet", async (tweet: Twit.Twitter.Status) => {
      if (this.isValid(tweet)) {
        this.analyze(tweet);
      }
    });
  }

  /**
   * Analyzes a tweet to have an impact on crypto symbols' probability.
   * @param tweet The tweet to analyze.
   */
  private async analyze(tweet: Twit.Twitter.Status) {
    const tweetText = this.getText(tweet);
    const [score, assets] = await Promise.all([
      this.getScore(tweetText),
      this.getAssets(tweetText),
    ]);

    if (assets.size == 0) return;

    const cryptoSymbolManager = await cryptoSymbolManagerPromise;

    for (const [
      ,
      cryptoSymbol,
    ] of cryptoSymbolManager.cryptoSymbols.entries()) {
      if (assets.has(cryptoSymbol.cryptoSymbolInfo.baseAsset.name)) {
        cryptoSymbol.addProbability(score);
      } else if (assets.has(cryptoSymbol.cryptoSymbolInfo.quoteAsset.name)) {
        cryptoSymbol.addProbability(-score);
      }
    }
  }

  /**
   * Finds assets mentioned in tweets.
   * @param tweetText The tweet to find assets in.
   * @returns All assets found in the tweet.
   */
  private async getAssets(tweetText: string): Promise<Map<string, Asset>> {
    // find all assets
    const assetsResults = await Promise.all(
      tweetText
        .split(/\s+/g)
        .map((word) =>
          this.getAsset(
            word[0] === "#" && word.length > 1 ? word.substring(1) : word
          )
        )
    );

    const filtered = assetsResults.filter((assetResult) => assetResult);

    // distinct values
    const assets: Map<string, Asset> = new Map<string, Asset>();
    for (const asset of filtered) {
      assets.set(asset.name, asset);
    }

    return assets;
  }

  /**
   * Checks if a word is an asset.
   * @param word The word that might be an asset.
   */
  private async getAsset(word: string): Promise<Asset> {
    const cryptoSymbolManager = await cryptoSymbolManagerPromise;
    const upper = word.toUpperCase();

    // full name check
    if (upper in this.assetsHelper.longToShort) {
      return cryptoSymbolManager.findOrCreateAsset(
        this.assetsHelper.longToShort[upper]
      );
    }

    // shorthand check
    if (upper === word && upper in this.assetsHelper.short) {
      return cryptoSymbolManager.findOrCreateAsset(upper);
    }

    return null;
  }

  /**
   * Performs sentiment analysis of a given tweet.
   * @param tweetText The phrase to give a score to.
   * @returns The sentiment of a tweet, a number between -1 and 1 indicating how positive a tweet is.
   */
  private async getScore(tweetText: string): Promise<number> {
    const sentimentScore = this.sentimentClient.analyze(tweetText).comparative;
    const nlpScore = (await this.nlpClient.getSentiment(tweetText)).comparative;
    return (sentimentScore + nlpScore) / 2;
  }

  /**
   * Checks if the tweet is a new tweet and its language is english. Taken from: https://github.com/tweepy/tweepy/issues/981#issuecomment-393817367.
   * @param tweet The tweet to check.
   * @returns true if it is an original tweet in english, false if it is a retweet/quote/reply...
   */
  private isValid(tweet: Twit.Twitter.Status): boolean {
    const notValidConditions = [
      tweet.retweeted_status,
      tweet.in_reply_to_status_id,
      tweet.in_reply_to_screen_name,
      tweet.in_reply_to_user_id,
      tweet.lang && tweet.lang != "en",
    ];
    return !notValidConditions.some((condition) => condition);
  }

  /**
   * Gets the tweet's text content, whether it's a tweet or a retweet.
   * @param tweet The actual tweet object.
   * @returns The tweet's text.
   */
  private getText(tweet: Twit.Twitter.Status): string {
    return tweet.truncated
      ? (tweet as any).extended_tweet.full_text
      : tweet.text;
  }

  /**
   * Starts the provider. This provider will analyze tweets from influential cryptocurrency people.
   */
  public async start() {
    if (config.has("twitterAccessToken")) {
      this.initSentimentAnalysis();
      this.loadAssetsHelper();
      this.setInstance();
      try {
        await this.startListening();
        console.log("Connected to Twitter.");
      } catch (error) {
        console.log("Failed to connect to Twitter.");
      }
    } else {
      console.log("Failed to connect to Twitter: Access tokens missing.");
    }
  }
}

export default new TwitterProvider();
