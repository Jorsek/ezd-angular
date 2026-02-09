/**
 * Generic interface for GWT presenter bridges.
 *
 * GWT presenters expose themselves via window objects (e.g., window.ccmsMetadataConfiguration)
 * to allow Angular components to mount, reveal, hide, and unmount them.
 *
 * This enables an "outside-in" integration pattern where Angular acts as the container
 * for GWT content during the migration period.
 *
 * @example
 * // In Angular component
 * const bridge = (window as WindowWithGwtBridge<'ccmsMyPresenter'>).ccmsMyPresenter;
 * if (bridge?.isInitialized()) {
 *   bridge.mount(containerElement);
 *   bridge.reveal();
 * }
 */
export interface GwtPresenterBridge {
  /**
   * Mount the GWT presenter into the specified container element.
   * This creates the GWT widget hierarchy inside the container.
   */
  mount: (container: HTMLElement) => void;

  /**
   * Reveal the GWT presenter, making it visible and triggering any onReveal logic.
   */
  reveal: () => void;

  /**
   * Hide the GWT presenter, making it invisible and triggering any onHide logic.
   */
  hide: () => void;

  /**
   * Unmount and cleanup the GWT presenter.
   * Should be called when the Angular component is destroyed.
   */
  unmount: () => void;

  /**
   * Check if the GWT presenter bridge has been initialized and is ready to use.
   */
  isInitialized: () => boolean;

  /**
   * Check if a feature flag is enabled.
   * Optional - only needed for bridges that need to expose feature flags to Angular.
   */
  isFeatureEnabled?: (feature: string) => boolean;
}

/**
 * Helper type for accessing GWT bridges on the window object.
 *
 * @example
 * type MetadataWindow = WindowWithGwtBridge<'ccmsMetadataConfiguration'>;
 * const bridge = (window as unknown as MetadataWindow).ccmsMetadataConfiguration;
 */
export type WindowWithGwtBridge<K extends string> = {
  [P in K]?: GwtPresenterBridge;
};
