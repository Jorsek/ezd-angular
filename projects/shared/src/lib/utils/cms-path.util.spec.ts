import { extractBranchName, extractFilename } from './cms-path.util';

describe('CmsPath Utility', () => {
  describe('extractBranchName', () => {
    it('should extract branch name from repository path', () => {
      const uri = '/db/organizations/test-org/repositories/master/content/documents/file.dita';
      expect(extractBranchName(uri)).toBe('master');
    });

    it('should handle branch names with special characters', () => {
      const uri =
        '/db/organizations/test-org/repositories/feature-branch-123/repo/documents/file.dita';
      expect(extractBranchName(uri)).toBe('feature-branch-123');
    });

    it('should return null for release paths', () => {
      const uri = '/db/organizations/test-org/releases/uuid-here/repo/documents/file.dita';
      expect(extractBranchName(uri)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(extractBranchName('')).toBeNull();
    });

    it('should return null for malformed paths with insufficient segments', () => {
      expect(extractBranchName('/db/organizations')).toBeNull();
    });

    it('should return null for paths without repositories segment', () => {
      const uri = '/db/organizations/test-org/other/branch/repo/documents/file.dita';
      expect(extractBranchName(uri)).toBeNull();
    });

    it('should handle paths with exactly 5 segments', () => {
      const uri = '/db/organizations/test-org/repositories/develop';
      expect(extractBranchName(uri)).toBe('develop');
    });
  });

  describe('extractFilename', () => {
    it('should extract filename from path', () => {
      const uri =
        '/db/organizations/test-org/repositories/master/content/documents/User_Guide.ditamap';
      expect(extractFilename(uri)).toBe('User_Guide.ditamap');
    });

    it('should return empty string for empty input', () => {
      expect(extractFilename('')).toBe('');
    });

    it('should handle paths with single segment', () => {
      expect(extractFilename('/file.txt')).toBe('file.txt');
    });

    it('should handle release paths', () => {
      const uri = '/db/organizations/test-org/releases/uuid/repo/documents/Config.ditamap';
      expect(extractFilename(uri)).toBe('Config.ditamap');
    });
  });
});
