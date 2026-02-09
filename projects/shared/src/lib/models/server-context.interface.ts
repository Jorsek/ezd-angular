/** Context type for insights - accepts both lowercase (component inputs) and uppercase (API) */
export type ContextType = 'map' | 'folder' | 'branch' | 'MAP' | 'FOLDER' | 'BRANCH';

/** Server context for scoped queries */
export type Context =
  | { type: 'FOLDER'; id: string }
  | { type: 'MAP'; id: string }
  | { type: 'BRANCH'; id: string };

/** Check if two contexts are equal (same type and id) */
export function contextEquals(
  a: Context | null | undefined,
  b: Context | null | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.type === b.type && a.id === b.id;
}
