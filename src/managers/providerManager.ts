import Provider from "./../interfaces/provider";

/**
 * The central place for all your provider needs.
 */
class ProviderManager {
  /**
   * All providers currently running.
   */
  public providers: Provider[];

  /**
   * Constructs the [[ProviderManager]].
   */
  public constructor() {
    this.providers = [];
  }

  /**
   * Adds a new provider to [[providers]] and starts it.
   * @param provider The new provider to be started.
   */
  public register(provider: Provider) {
    this.providers.push(provider);
    provider.start();
  }
}

/**
 * The actual instance.
 */
const providerManager = new ProviderManager();
export default providerManager;
