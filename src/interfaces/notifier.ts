import { SymbolEvent } from "./../models/symbolEvent";
/**
 * An object with the ability to notify users of [[SymbolEvent]]s through various channels.
 */
export default interface Notifier {
  /**
   * Initializes this notifier.
   */
  start?();

  /**
   * Given a symbol event, notifies all its followers of the event.
   * @param symbolEvent The event to notify about.
   */
  notify(symbolEvent: SymbolEvent);
}
