/**
 * A data transfer object for sending a [[SymbolEvent]].
 */
export default interface EventDto {
  /**
   * The probability threshold that was passed and caused this event to be fired.
   */
  probability: number;

  /**
   * The UTC date marking the time this event was fired.
   */
  firedAt: number;

  /**
   * The base asset's name of the symbol of the event.
   */
  baseAssetName: string;

  /**
   * The base asset's name of the symbol of the event.
   */
  quoteAssetName: string;
}
