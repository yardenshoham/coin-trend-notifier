import Provider from "./../interfaces/provider";
import Twit from "twit";
import config from "config";

/**
 * A class that monitors tweets about cryptocurrency and adds probabilities appropriately.
 */
class TwitterProvider implements Provider {
  /**
   * The api client. https://github.com/ttezel/twit.
   */
  private twit: Twit;

  /**
   * Creates the Twitter api client and sets it to [[twit]].
   */
  private setInstance() {
    this.twit = new Twit({
      consumer_key: config.get("twitterConsumerKey"),
      consumer_secret: config.get("twitterConsumerSecret"),
      access_token: config.get("twitterAccessToken"),
      access_token_secret: config.get("twitterAccessTokenSecret")
    });
  }

  /**
   * Starts listening to tweets from important cryptocurrency people.
   */
  private async startListening() {
    // get users to follow
    const response = await this.twit.get("friends/ids", {
      screen_name: "trend_notifier"
    });

    // open follow stream
    const stream = this.twit.stream("statuses/filter", {
      follow: (response.data as any).ids
    });

    stream.on("tweet", (tweet: Twit.Twitter.Status) => {
      if (this.isValid(tweet)) {
        this.analyze(tweet);
      }
    });
  }

  private analyze(tweet: Twit.Twitter.Status) {
    throw new Error("Method not implemented." + tweet);
  }

  /**
   * Checks if the tweet is a new tweet and its language is english. Taken from: https://github.com/tweepy/tweepy/issues/981#issuecomment-393817367.
   * @param tweet The tweet to check.
   * @returns true if it is an original tweet in english, false if it is a retweet/quote/reply...
   */
  private isValid(tweet: Twit.Twitter.Status): boolean {
    if (
      tweet.retweeted_status ||
      tweet.in_reply_to_status_id ||
      tweet.in_reply_to_screen_name ||
      tweet.in_reply_to_user_id ||
      (tweet.lang && tweet.lang != "en")
    ) {
      return false;
    }
    return true;
  }

  /**
   * Starts the provider. This provider will analyze tweets from influential cryptocurrency people.
   */
  public start() {
    if (config.has("twitterAccessToken")) {
      this.setInstance();
      return this.startListening();
    }
  }
}

export default new TwitterProvider();
