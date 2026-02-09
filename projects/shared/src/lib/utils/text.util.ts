export function enumToFriendly(enumStr: string): string {
  if (!enumStr) {
    return '';
  }

  return enumStr
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
