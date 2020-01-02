import PreferenceDto from "./preferenceDto";
/**
 * A data transfer object that contains information for a preference addition/update.
 */
export default interface SetPreferenceDto extends PreferenceDto {
  /**
   * The threshold for which to notify the user.
   */
  probability: number;
}
