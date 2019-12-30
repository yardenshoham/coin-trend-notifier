/**
 * Contains information for a preference addition/update.
 */
export default interface SetPreferenceDto {
  /**
   * The id of the user that wants to set preference.
   */
  userId: string;

  /**
   * The base asset's name of the preference.
   */
  baseAssetName: string;

  /**
   * The quote asset's name of the preference.
   */
  quoteAssetName: string;

  /**
   * The threshold for which to notify the user.
   */
  probability: number;
}
