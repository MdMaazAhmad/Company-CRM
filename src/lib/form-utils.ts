/**
 * Shared helpers for extracting and normalising FormData values in server actions.
 * Centralises the str/intOrNull/floatOrNull/normPhone/normEmail pattern that was
 * duplicated across every action file.
 */

/** Trim a FormData value, returning "" if blank. */
export function fdStr(formData: FormData, key: string): string {
  const v = formData.get(key);
  return v == null ? "" : String(v).trim();
}

/** Trim a FormData value, returning null if blank. */
export function fd(formData: FormData, key: string): string | null {
  const v = fdStr(formData, key);
  return v || null;
}

/** Parse an int from a FormData field, or null if empty/invalid. */
export function fdInt(formData: FormData, key: string): number | null {
  const v = fdStr(formData, key);
  if (!v) return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

/** Parse a float from a FormData field, or null if empty/invalid. */
export function fdFloat(formData: FormData, key: string): number | null {
  const v = fdStr(formData, key);
  if (!v) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

/** Parse a Date from a FormData field, or null if empty. */
export function fdDate(formData: FormData, key: string): Date | null {
  const v = fdStr(formData, key);
  return v ? new Date(v) : null;
}

/** Normalise a phone number to the last 10 digits, or null if too short. */
export function normPhone(v: string | null): string | null {
  if (!v) return null;
  const digits = v.replace(/\D/g, "");
  return digits.length >= 7 ? digits.slice(-10) : null;
}

/** Lowercase-trim an email address, returning null if blank. */
export function normEmail(v: string | null | FormDataEntryValue): string | null {
  if (v == null) return null;
  const s = String(v).trim().toLowerCase();
  return s || null;
}
