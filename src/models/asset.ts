import { id, Repository } from "@yardenshoham/mongodb-typescript";
import { ObjectId } from "mongodb";
import { clientPromise } from "../database/client";
import { IsUppercase, IsDefined } from "class-validator";

/**
 * Represents a crypto asset.
 *
 * For example: BTC, ETH, USDT...
 */
export class Asset {
  /**
   * The id of this document in the database.
   */
  @id
  public _id: ObjectId;

  /**
   * The name of the asset. Could be "USDT", "ETH", "BTC" etc...
   */
  @IsDefined()
  @IsUppercase()
  public readonly name: string;

  /**
   * Constructs a new crypto asset.
   *
   * @param name The name of the asset. Could be "USDT", "ETH", "BTC" etc...
   */
  constructor(name: string) {
    this.name = name;
  }
}

/**
 * The context from which one could access all [[Asset]] documents.
 */
export const assetDbPromise = (async function() {
  return new Repository<Asset>(Asset, await clientPromise, "assets");
})();
