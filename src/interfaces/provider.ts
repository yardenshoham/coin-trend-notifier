/**
 * A provider is an entity that collects information about cryptocurrency and manipulates [[Chance]].
 */
export default interface Provider {
  /**
   * Every provider has a start method to begin collecting cryptocurrency information.
   */
  start(): void | Promise<void>;
}
