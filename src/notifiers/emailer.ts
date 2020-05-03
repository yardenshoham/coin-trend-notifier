import Notifier from "../interfaces/notifier";
import nodemailer from "nodemailer";
import Email from "email-templates";
import config from "config";
import { SymbolEvent } from "./../models/symbolEvent";
import path from "path";
import { userDbPromise } from "../models/user";
import { ObjectId } from "mongodb";
/* istanbul ignore next */

/**
 * A notifier that sends emails.
 */
class Emailer implements Notifier {
  /**
   * The email client.
   */
  private email: Email;

  /**
   * Constructs [[email]].
   */
  public constructor() {
    const emailAddress = config.get("emailAddress") as string;

    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailAddress,
        pass: config.get("emailPassword"),
      },
    });

    this.email = new Email({
      message: {
        from: emailAddress,
      },
      send: config.get("sendEmail") !== "false",
      transport,
      views: { root: path.join(__dirname, "/../templates") },
      preview: false,
    });
  }

  /**
   * Sends an email to the event's subscribers.
   * @param symbolEvent The event to send an email about.
   */
  public notify(symbolEvent: SymbolEvent) {
    const template = symbolEvent.probability > 0 ? "up" : "down";
    const percentage = Math.round(Math.abs(symbolEvent.probability) * 100);
    const symbolString = `${symbolEvent.cryptoSymbolInfo.baseAsset.name}${symbolEvent.cryptoSymbolInfo.quoteAsset.name}`;
    const symbolEventId = symbolEvent._id.toHexString();
    return Promise.all(
      symbolEvent
        .getSubscribers()
        .map((userId) =>
          this.sendMail(
            userId,
            template,
            percentage,
            symbolString,
            symbolEventId
          )
        )
    );
  }

  /**
   * Sends a custom email to the given user.
   * @param userId The hex string representation of the ObjectId of the user.
   * @param template The template of the email.
   * @param percentage The certainty the event is going to occur. Between 0 and 100.
   * @param symbolString The string representation of the crypto symbol.
   * @param symbolEventId The hex string representation of the ObjectId of the symbolEvent.
   */
  private async sendMail(
    userId: string,
    template: "up" | "down",
    percentage: number,
    symbolString: string,
    symbolEventId: string
  ) {
    const user = await (await userDbPromise).findById(
      ObjectId.createFromHexString(userId)
    );

    if (
      !user ||
      (user.notifiedAt &&
        user.alertLimit &&
        user.notifiedAt + user.alertLimit > Date.now() * 1000)
    )
      return;

    return this.email.send({
      template,
      message: {
        to: user.email,
      },
      locals: {
        username: user.username,
        percentage,
        symbolString,
        symbolEventId,
      },
    });
  }
}

export default new Emailer();
