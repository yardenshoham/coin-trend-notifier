import { SymbolEvent, symbolEventDbPromise } from "../models/symbolEvent";
import { ObjectId } from "mongodb";
import UserDoesNotExistError from "../errors/userDoesNotExistError";
import { userDbPromise } from "../models/user";
import EventDto from "./../interfaces/dtos/eventDto";

/**
 * A service to perform various symbol event related methods.
 */
export default class EventService {
  /**
   * @returns recent events the user was interested in.
   * @param userId The id of the interested user.
   * @param amount The amount of events to return. If not provided, all events are returned.
   */
  public async getEvents(userId: string, amount?: number): Promise<EventDto[]> {
    if (amount && amount < 0) {
      throw new RangeError("amount must be a positive integer");
    }

    // make sure user exists
    let objectId: ObjectId;
    try {
      objectId = ObjectId.createFromHexString(userId);
    } catch {
      throw new UserDoesNotExistError();
    }
    const user = await (await userDbPromise).findById(objectId);
    if (!user) {
      throw new UserDoesNotExistError();
    }

    // query db
    const key = `cryptoSymbolInfo.preferences.${userId}`;
    const $key = `${key}`;

    let cursor = (await symbolEventDbPromise)
      .find({
        $and: [
          {
            key: {
              $exists: true
            }
          },
          {
            $expr: {
              $or: [
                {
                  $and: [
                    {
                      $gt: [$key, 0]
                    },
                    {
                      $lte: [$key, "$probability"]
                    }
                  ]
                },
                {
                  $and: [
                    {
                      $lt: [$key, 0]
                    },
                    {
                      $gte: [$key, "$probability"]
                    }
                  ]
                }
              ]
            }
          }
        ]
      })
      .sort("firedAt", -1);

    if (amount) {
      cursor = cursor.limit(amount);
    }

    return (await cursor.toArray()).map((symbolEvent: SymbolEvent) => {
      const eventDto: EventDto = {
        probability: symbolEvent.probability,
        firedAt: symbolEvent.firedAt,
        baseAssetName: symbolEvent.cryptoSymbolInfo.baseAsset.name,
        quoteAssetName: symbolEvent.cryptoSymbolInfo.quoteAsset.name
      };
      return eventDto;
    });
  }
}
