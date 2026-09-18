// Decodes a JWT's payload on the client WITHOUT verifying the signature.
// This is fine for reading non-sensitive display info (name/email/etc.) that
// the backend already put in the token — never trust this for authorization
// decisions, since anyone can forge an unsigned-looking payload client-side.
// Actual auth/authorization must still be enforced server-side.

export interface DecodedToken {
  user_id?: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  user_gender?: string;
  user_address?: string;
  user_dob?: string;
  user_age?: string;
  user_blood?: string;
  user_allergies?: string;
  user_emergency?: string;
  is_social?: number;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

export function decodeJwt<T = DecodedToken>(token: string): T | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );

    const json =
      typeof window !== "undefined"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf-8");

    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

// Returns true if the token's `exp` claim (seconds since epoch) is in the past.
// Returns false if there's no exp claim or the token can't be decoded, so
// callers should treat "can't tell" as "not expired" rather than blocking.
export function isJwtExpired(token: string): boolean {
  const decoded = decodeJwt(token);
  if (!decoded?.exp) return false;
  return Date.now() >= decoded.exp * 1000;
}