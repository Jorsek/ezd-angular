/**
 * Utility validation functions
 */
export class Validators {
  /**
   * Validates UUID format (RFC 4122)
   *
   * @param uuid - The UUID string to validate
   * @returns true if valid UUID format, false otherwise
   */
  static isValidUuid(uuid: string): boolean {
    if (!uuid?.trim()) {
      return false;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}
