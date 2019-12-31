import SetPreferenceDto from "./../interfaces/dtos/setPreferenceDto";
import { ObjectId } from "mongodb";
import cryptoSymbolManagerPromise from "./../managers/cryptoSymbolManager";
import { cryptoSymbolDbPromise } from "../models/cryptoSymbol";
import UserDoesNotExistError from "../errors/userDoesNotExistError";
import { userDbPromise } from "../models/user";

/**
 * A service to perform various preference related methods.
 */
export default class PreferenceService {
  /**
   * Sets a user's wanted probability threshold to be notified about a rise/fall of a symbol.
   * @param request The request containing the user's id, the symbol information and the wanted probability threshold.
   * @throws {RangeError} If the probability is not between -1 and 1.
   * @throws [[UserDoesNotExistError]] If the given user's id is not found.
   * @throws [ValidationError](https://github.com/typestack/class-validator#validation-errors)[] If either of the assets is not valid.
   */
  public static async setPreference(request: SetPreferenceDto): Promise<void> {
    if (request.probability < -1 || request.probability > 1) {
      throw new RangeError("The probability must be between -1 and 1");
    }

    // make sure user exists
    let objectId: ObjectId;
    try {
      objectId = ObjectId.createFromHexString(request.userId);
    } catch {
      throw new UserDoesNotExistError();
    }

    const user = await (await userDbPromise).findById(objectId);
    if (!user) {
      throw new UserDoesNotExistError();
    }

    const cryptoSymbol = await (
      await cryptoSymbolManagerPromise
    ).getCryptoSymbol(request.baseAssetName, request.quoteAssetName);

    cryptoSymbol.cryptoSymbolInfo.preferences.set(
      request.userId,
      request.probability
    );

    return (await cryptoSymbolDbPromise).save(cryptoSymbol);
  }
}
