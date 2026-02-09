/**
 * Utility functions for file downloads
 */

/**
 * Downloads a Blob as a file
 *
 * @param blob - The Blob to download
 * @param filename - The filename to save as
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
