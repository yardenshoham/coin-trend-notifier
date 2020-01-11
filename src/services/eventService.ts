import { SymbolEvent, symbolEventDbPromise } from "../models/symbolEvent";
import EventDto from "../dtos/eventDto";
import { FilterQuery, ObjectId } from "mongodb";
import UserService from "./userService";

/**
 * A service to perform various symbol event related methods.
 */
export default class EventService {
  /**
   * @returns recent events the user was interested in.
   * @param userId The id of the interested user.
   * @param amount The amount of events to return. If not provided, all events are returned.
   */
  public static async getEvents(
    userId: string,
    amount: number = 0
  ): Promise<EventDto[]> {
    if (amount && amount < 0) {
      throw new RangeError("amount must be a positive integer");
    }

    // make sure user exists
    await UserService.getById(userId);

    // query db
    let cursor = (await symbolEventDbPromise)
      .find(this.buildFetchQuery(`cryptoSymbolInfo.preferences.${userId}`))
      .sort("firedAt", -1)
      .limit(amount);

    const populatedEvents = await Promise.all(
      (await cursor.toArray()).map(async (symbolEvent: SymbolEvent) => {
        await symbolEvent.cryptoSymbolInfo.populate();
        return symbolEvent;
      })
    );

    return populatedEvents.map((symbolEvent: SymbolEvent) => {
      const eventDto: EventDto = {
        _id: symbolEvent._id.toHexString(),
        probability: symbolEvent.probability,
        firedAt: symbolEvent.firedAt,
        baseAssetName: symbolEvent.cryptoSymbolInfo.baseAsset.name,
        quoteAssetName: symbolEvent.cryptoSymbolInfo.quoteAsset.name
      };
      return eventDto;
    });
  }

  private static buildFetchQuery(queryKey: string): FilterQuery<SymbolEvent> {
    const $queryKey = `$${queryKey}`;

    // prettier-ignore
    return {$and:[{[queryKey]:{$exists:true}},{$expr:{$or:[{$and:[{$gt:[$queryKey,0]},{$lte:[$queryKey,"$probability"]}]},{$and:[{$lt:[$queryKey,0]},{$gte:[$queryKey,"$probability"]}]}]}}]};
  }

  /**
   * Retrieves an event.
   * @param eventId The id of the event to retrieve.
   */
  public static async findEventById(eventId: string): Promise<EventDto> {
    try {
      const event = await (await symbolEventDbPromise).findById(
        ObjectId.createFromHexString(eventId)
      );
      if (!event) {
        throw new Error();
      }
      await event.cryptoSymbolInfo.populate();
      return {
        _id: eventId,
        baseAssetName: event.cryptoSymbolInfo.baseAsset.name,
        quoteAssetName: event.cryptoSymbolInfo.quoteAsset.name,
        firedAt: event.firedAt,
        probability: event.probability
      };
    } catch (error) {
      throw new Error("Event not found.");
    }
  }
}
