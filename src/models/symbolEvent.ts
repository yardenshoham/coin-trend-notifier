import { CryptoSymbolInfo } from "./cryptoSymbolInfo";
import { id, Repository, nested } from "mongodb-typescript";
import { ObjectId } from "mongodb";
import { clientPromise } from "../database/client";
import { IsDefined, Min, Max } from "class-validator";

/**
 * An event that's fired when a probability for a cryptocurrency's value is going to rise/fall
 * with a certain probability.
 *
 * @event
 */
export class SymbolEvent {
  /**
   * The id of this document in the database.
   */
  @id
  public _id: ObjectId;

  /**
   * The probability threshold that was passed and caused this event to be fired.
   */
  @IsDefined()
  @Min(-1)
  @Max(1)
  public probability: number;

  /**
   * The symbol associated with this event. It has a [[probability]] to rise/fall in the near future.
   */
  @IsDefined()
  @nested(/* istanbul ignore next */ () => CryptoSymbolInfo)
  public cryptoSymbolInfo: CryptoSymbolInfo;

  /**
   * The UTC date marking the time this event was fired.
   */
  @IsDefined()
  public firedAt: number;

  /**
   * Constructs an event to be fired.
   *
   * @param probability The probability threshold that was passed and caused this event to be fired.
   * @param cryptoSymbolInfo  The symbol associated with this event.
   */
  constructor(probability: number, cryptoSymbolInfo: CryptoSymbolInfo) {
    this.probability = probability;
    this.cryptoSymbolInfo = cryptoSymbolInfo;
  }

  /**
   * @returns an array of user id's that want to be notified about this event.
   */
  getSubscribers(): string[] {
    const result: string[] = [];
    const abs = Math.abs(this.probability);
    for (const [userId, wantedProbability] of this.cryptoSymbolInfo
      .preferences) {
      if (Math.abs(wantedProbability) <= abs) {
        result.push(userId);
      }
    }
    return result;
  }
}

/**
 * The context from which one could access all [[SymbolEvent]] documents.
 */
export const symbolEventDbPromise = (async function () {
  return new Repository<SymbolEvent>(
    SymbolEvent,
    await clientPromise,
    "symbolEvents"
  );
})();
