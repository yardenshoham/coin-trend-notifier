import { IsDefined, IsUppercase } from "class-validator";

/**
 * A data transfer object that contains information for a general preference request preference addition/update.
 */
export default class PreferenceDto {
  /**
   * The base asset's name of the preference.
   */
  @IsDefined()
  @IsUppercase()
  baseAssetName: string;

  /**
   * The quote asset's name of the preference.
   */
  @IsDefined()
  @IsUppercase()
  quoteAssetName: string;
}
