import cryptoSymbolManagerPromise from "./../managers/cryptoSymbolManager";
import { cryptoSymbolDbPromise } from "../models/cryptoSymbol";
import SetPreferenceDto from "./../interfaces/dtos/setPreferenceDto";
import UserService from "./userService";

/**
 * A service to perform various preference related methods.
 */
export default class PreferenceService {
  /**
   * Sets a user's wanted probability threshold to be notified about a rise/fall of a symbol.
   * @param userId The user's ObjectId's hex string.
   * @param baseAssetName The name of the base asset of the symbol.
   * @param quoteAssetName The name of the quote asset of the symbol.
   * @param probability The wanted probability threshold to be notified about a rise/fall of a symbol.
   * @throws {RangeError} If the probability is not between -1 and 1.
   * @throws [[UserDoesNotExistError]] If the given user's id is not found.
   * @throws [ValidationError](https://github.com/typestack/class-validator#validation-errors)[] If either of the assets is not valid.
   */
  public static async setPreference(
    userId: string,
    baseAssetName: string,
    quoteAssetName: string,
    probability: number
  ): Promise<void> {
    if (probability < -1 || probability > 1) {
      throw new RangeError("The probability must be between -1 and 1");
    }

    // make sure user exists
    await UserService.getById(userId);

    const cryptoSymbol = await (
      await cryptoSymbolManagerPromise
    ).getCryptoSymbol(baseAssetName, quoteAssetName);

    cryptoSymbol.cryptoSymbolInfo.preferences.set(userId, probability);

    return (await cryptoSymbolDbPromise).save(cryptoSymbol);
  }

  /**
   * Removes a user's preference from a certain symbol.
   * @param userId The user's ObjectId's hex string.
   * @param baseAssetName The name of the base asset of the symbol.
   * @param quoteAssetName The name of the quote asset of the symbol.
   * @throws [[UserDoesNotExistError]] If the given user's id is not found.
   */
  public static async deletePreference(
    userId: string,
    baseAssetName: string,
    quoteAssetName: string
  ) {
    // make sure user exists
    await UserService.getById(userId);

    const cryptoSymbolManager = await cryptoSymbolManagerPromise;
    const assetString = `${baseAssetName} ${quoteAssetName}`;
    if (cryptoSymbolManager.cryptoSymbols.has(assetString)) {
      const cryptoSymbol = cryptoSymbolManager.cryptoSymbols.get(assetString);
      if (cryptoSymbol.cryptoSymbolInfo.preferences.has(userId)) {
        cryptoSymbol.cryptoSymbolInfo.preferences.delete(userId);
        await (await cryptoSymbolDbPromise).save(cryptoSymbol);
      }
    }
  }

  /**
   * Retrieves all of the given user's preferences.
   * @param userId The user's ObjectId's hex string.
   * @throws [[UserDoesNotExistError]] If the given user's id is not found.
   */
  public static async getPreferences(
    userId: string
  ): Promise<SetPreferenceDto[]> {
    // make sure user exists
    await UserService.getById(userId);

    let result: SetPreferenceDto[] = [];

    const cryptoSymbolManager = await cryptoSymbolManagerPromise;
    for (const [, cryptoSymbol] of cryptoSymbolManager.cryptoSymbols) {
      if (cryptoSymbol.cryptoSymbolInfo.preferences.has(userId)) {
        const preference: SetPreferenceDto = {
          baseAssetName: cryptoSymbol.cryptoSymbolInfo.baseAsset.name,
          quoteAssetName: cryptoSymbol.cryptoSymbolInfo.quoteAsset.name,
          probability: cryptoSymbol.cryptoSymbolInfo.preferences.get(userId)
        };
        result.push(preference);
      }
    }

    return result;
  }
}
