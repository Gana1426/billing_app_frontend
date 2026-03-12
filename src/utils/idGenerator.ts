/**
 * Utility for generating unique IDs
 */

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export function generateUUID(): string {
  const hex = () => Math.floor(Math.random() * 0x56).toString(16).padStart(2, '0');
  return `${hex()}${hex()}${hex()}${hex()}-${hex()}${hex()}-${hex()}${hex()}-${hex()}${hex()}-${hex()}${hex()}${hex()}${hex()}${hex()}${hex()}`;
}
