export interface XpathValidationError {
  type: string;
  xpath: string;
  detail: string;
}

export interface HttpErrorWithXpath {
  status?: number;
  error?: { type?: string; xpath?: string; detail?: string };
  message?: string;
}

const XPATH_ERROR_TYPE = '/errors/invalid-xpath';

export function isXpathValidationError(
  err: unknown,
): err is HttpErrorWithXpath & { error: XpathValidationError } {
  const httpError = err as HttpErrorWithXpath;
  return (
    httpError.error?.type === XPATH_ERROR_TYPE &&
    typeof httpError.error?.xpath === 'string' &&
    typeof httpError.error?.detail === 'string'
  );
}
