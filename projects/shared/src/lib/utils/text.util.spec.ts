import { describe, expect, it } from 'vitest';
import { enumToFriendly } from './text.util';

describe('Text Utility', () => {
  describe('enumToFriendly', () => {
    it('should convert snake_case enum to Title Case words', () => {
      expect(enumToFriendly('HELLO_WORLD')).toBe('Hello World');
      expect(enumToFriendly('USER_PROFILE_SETTINGS')).toBe('User Profile Settings');
    });

    it('should handle single word enums', () => {
      expect(enumToFriendly('ADMIN')).toBe('Admin');
      expect(enumToFriendly('USER')).toBe('User');
    });

    it('should handle lowercase enum values', () => {
      expect(enumToFriendly('hello_world')).toBe('Hello World');
    });

    it('should handle mixed case enum values', () => {
      expect(enumToFriendly('Hello_World')).toBe('Hello World');
      expect(enumToFriendly('user_Profile_SETTINGS')).toBe('User Profile Settings');
    });

    it('should return empty string for empty input', () => {
      expect(enumToFriendly('')).toBe('');
    });

    it('should return empty string for null or undefined input', () => {
      expect(enumToFriendly(null as unknown as string)).toBe('');
      expect(enumToFriendly(undefined as unknown as string)).toBe('');
    });
  });
});
