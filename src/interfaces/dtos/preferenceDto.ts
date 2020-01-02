/**
 * A data transfer object that contains information for a general preference request preference addition/update.
 */
export default interface PreferenceDto {
  /**
   * The base asset's name of the preference.
   */
  baseAssetName: string;

  /**
   * The quote asset's name of the preference.
   */
  quoteAssetName: string;
}
