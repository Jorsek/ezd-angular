import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { Configuration, ConfigurationParameters } from './configuration';
import { BASE_PATH } from './variables';

/**
 * Extended Configuration that assumes all responses are JSON.
 *
 * The OpenAPI generator produces a wildcard Accept header for endpoints
 * that do not explicitly specify a response content type. This causes
 * Angular HttpClient to return a Blob instead of parsed JSON.
 *
 * Since our backend only returns JSON, we override isJsonMime to always
 * return true, ensuring responses are always parsed as JSON.
 */
class ApiConfiguration extends Configuration {
  constructor(params: ConfigurationParameters = {}) {
    super(params);
  }

  /**
   * Override to always treat responses as JSON.
   * Our backend only returns JSON, so we can safely assume all responses are JSON.
   */
  override isJsonMime(): boolean {
    return true;
  }
}

/**
 * Provides API configuration for the application.
 *
 * @param configOrBasePath - Either a base path string or configuration parameters
 * @returns Environment providers for the API services
 */
export function provideApi(
  configOrBasePath: string | ConfigurationParameters,
): EnvironmentProviders {
  const config =
    typeof configOrBasePath === 'string'
      ? new ApiConfiguration({ basePath: configOrBasePath })
      : new ApiConfiguration({ ...configOrBasePath });

  return makeEnvironmentProviders([
    { provide: BASE_PATH, useValue: config.basePath },
    { provide: Configuration, useValue: config },
  ]);
}
