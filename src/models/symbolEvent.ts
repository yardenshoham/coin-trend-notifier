import { CryptoSymbolInfo } from "./cryptoSymbolInfo";
import { id, Repository, nested } from "@yardenshoham/mongodb-typescript";
import { ObjectId } from "mongodb";
import { clientPromise } from "../database/client";
import { IsDefined } from "class-validator";

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
  public readonly probability: number;

  /**
   * The symbol associated with this event. It has a [[probability]] to rise/fall in the near future.
   */
  @IsDefined()
  @nested(/* istanbul ignore next */ () => CryptoSymbolInfo)
  public readonly cryptoSymbolInfo: CryptoSymbolInfo;

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
}

/**
 * The context from which one could access all [[SymbolEvent]] documents.
 */
export const symbolEventDbPromise = (async function() {
  return new Repository<SymbolEvent>(
    SymbolEvent,
    await clientPromise,
    "symbolEvents"
  );
})();
