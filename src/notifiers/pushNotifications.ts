import Notifier from "../interfaces/notifier";
import { SymbolEvent } from "../models/symbolEvent";
import admin from "firebase-admin";
import { userDbPromise } from "../models/user";
import { ObjectId } from "mongodb";
import serviceAccount from "./serviceAccountKey.json";

/**
 * Notifies by sending mobile push notifications.
 */
class PushNotifications implements Notifier {
  NOTIFICATION_OPTIONS: admin.messaging.MessagingOptions = {
    priority: "high",
    timeToLive: 60 * 60 * 24,
  };

  /**
   * Initializes the firebase service.
   */
  start() {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      databaseURL: "https://coin-trend-notifier.firebaseio.com",
    });
  }

  /**
   * Sends a push notification to the event's subscribers.
   * @param symbolEvent The event to send a push notification about.
   */
  notify = (symbolEvent: SymbolEvent) => {
    const rise = symbolEvent.probability > 0;
    const title = `${rise ? "↗" : "↘"} ${
      symbolEvent.cryptoSymbolInfo.baseAsset.name
    }/${symbolEvent.cryptoSymbolInfo.quoteAsset.name}'s value will ${
      rise ? "rise" : "drop"
    }!`;
    const body = `I'm ${Math.round(
      Math.abs(symbolEvent.probability) * 100
    )}% sure ${symbolEvent.cryptoSymbolInfo.baseAsset.name}/${
      symbolEvent.cryptoSymbolInfo.quoteAsset.name
    }'s value is going to go ${rise ? "up" : "down"}...`;

    return Promise.all(
      symbolEvent
        .getSubscribers()
        .map((userId) => this.pushNotification(userId, title, body))
    );
  };

  /**
   * Sends a push notification to the user.
   * @param userId The user to send the push notification to.
   * @param title The title of the push notification.
   * @param body The body of the push notification.
   */
  async pushNotification(userId: string, title: string, body: string) {
    const user = await (await userDbPromise).findById(
      ObjectId.createFromHexString(userId)
    );

    if (
      !user ||
      (user.notifiedAt &&
        user.alertLimit &&
        user.notifiedAt + user.alertLimit > Date.now() * 1000) ||
      !user.firebaseInstanceIdToken
    )
      return;

    return admin.messaging().sendToDevice(
      user.firebaseInstanceIdToken,
      {
        notification: {
          title,
          body,
        },
      },
      this.NOTIFICATION_OPTIONS
    );
  }
}

export default new PushNotifications();
