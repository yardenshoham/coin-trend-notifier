import {
  IsDefined,
  IsNumber,
  Min,
  IsMongoId,
  Max,
  IsPositive,
  IsUppercase
} from "class-validator";

/**
 * A data transfer object for sending a [[SymbolEvent]].
 */
export default class EventDto {
  /**
   * The id of the event.
   */
  @IsDefined()
  @IsMongoId()
  _id: string;

  /**
   * The probability threshold that was passed and caused this event to be fired.
   */
  @IsDefined()
  @IsNumber()
  @Min(-1)
  @Max(1)
  probability: number;

  /**
   * The UTC date marking the time this event was fired.
   */
  @IsDefined()
  @IsPositive()
  firedAt: number;

  /**
   * The base asset's name of the symbol of the event.
   */
  @IsDefined()
  @IsUppercase()
  baseAssetName: string;

  /**
   * The base asset's name of the symbol of the event.
   */
  @IsDefined()
  @IsUppercase()
  quoteAssetName: string;
}
