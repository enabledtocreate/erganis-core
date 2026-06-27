import { ulid } from 'ulid';

const PUBLIC_ID_PATTERN = /^[a-z][a-z0-9_]{0,31}_[0-9A-HJKMNP-TV-Z]{26}$/;

export function createPublicId(type: string): string {
  const normalized = type.trim().toLowerCase();
  if (!/^[a-z][a-z0-9_]{0,31}$/.test(normalized)) {
    throw new Error(`Invalid public id type: ${type}`);
  }
  return `${normalized}_${ulid()}`;
}

export function isValidPublicId(value: string): boolean {
  return PUBLIC_ID_PATTERN.test(value);
}

export function parsePublicIdType(value: string): string | null {
  if (!isValidPublicId(value)) {
    return null;
  }
  return value.slice(0, value.lastIndexOf('_'));
}
