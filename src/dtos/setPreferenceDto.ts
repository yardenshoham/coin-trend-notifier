import PreferenceDto from "./preferenceDto";
import { IsDefined, IsNumber, Min, Max } from "class-validator";

/**
 * A data transfer object that contains information for a preference addition/update.
 */
export default class SetPreferenceDto extends PreferenceDto {
  /**
   * The threshold for which to notify the user.
   */
  @IsDefined()
  @IsNumber()
  @Min(-1)
  @Max(1)
  probability: number;
}
