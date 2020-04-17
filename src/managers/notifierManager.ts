import Notifier from "../interfaces/notifier";
import { SymbolEvent } from "./../models/symbolEvent";

/**
 * The central place for all your notifier needs.
 */
class NotifierManager implements Notifier {
  /**
   * All notifiers currently running.
   */
  public notifiers: Notifier[];

  /**
   * Constructs the [[NotifierManager]].
   */
  public constructor() {
    this.notifiers = [];
  }

  /**
   * Adds a new notifier to [[notifiers]] and starts it.
   * @param notifier The new notifier to be registered.
   */
  public register(notifier: Notifier) {
    this.notifiers.push(notifier);
    if (notifier.start) {
      notifier.start();
    }
  }

  /**
   * Activates all notifiers.
   * @param symbolEvent The event to notify about.
   */
  notify = (symbolEvent: SymbolEvent) => {
    this.notifiers.forEach((notifier) => notifier.notify(symbolEvent));
  };
}

/**
 * The actual instance.
 */
const notifierManager = new NotifierManager();
export default notifierManager;
