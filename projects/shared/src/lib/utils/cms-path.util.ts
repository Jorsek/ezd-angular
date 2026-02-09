/**
 * Extracts the branch name from an EZD resource URI.
 *
 * URI Format: /db/organizations/{orgId}/repositories/{branchName}/...
 *
 * @param resourceUri - The EZD path
 * @returns Branch name or null if not extractable (e.g., for release paths)
 */
export function extractBranchName(resourceUri: string): string | null {
  if (!resourceUri) {
    return null;
  }

  const segments = resourceUri.split('/').filter(Boolean);

  // segments: [db, organizations, orgId, repositories, branchName, ...]
  // Minimum segments needed: db, organizations, orgId, repositories, branchName = 5
  if (segments.length >= 5 && segments[3] === 'repositories') {
    return segments[4];
  }

  return null;
}

/**
 * Extracts the filename (last segment) from an EZD resource URI.
 *
 * @param resourceUri - The EZD path
 * @returns The filename or empty string if not extractable
 */
export function extractFilename(resourceUri: string): string {
  if (!resourceUri) {
    return '';
  }

  const segments = resourceUri.split('/').filter(Boolean);
  return segments[segments.length - 1] || '';
}

/**
 * Extracts the folder display name from an EZD folder path.
 * If the folder is "documents" (repository documents folder), returns the parent folder name.
 *
 * Example:
 * - /db/organizations/jorsek/repositories/master/dita-langref/documents -> "dita-langref"
 * - /db/organizations/jorsek/repositories/master/my-folder -> "my-folder"
 *
 * @param folderPath - The EZD folder path
 * @returns The display name for the folder
 */
export function extractFolderDisplayName(folderPath: string): string {
  if (!folderPath) {
    return '';
  }

  const segments = folderPath.split('/').filter(Boolean);
  const folderName = segments[segments.length - 1] || '';

  // Check if this is a repository documents folder
  // Path format: /db/organizations/{orgId}/repositories/{branch}/{repo}/documents
  if (
    segments.length === 7 &&
    segments[0] === 'db' &&
    segments[1] === 'organizations' &&
    segments[3] === 'repositories' &&
    segments[6] === 'documents'
  ) {
    return segments[5] || folderName;
  }

  return folderName;
}
