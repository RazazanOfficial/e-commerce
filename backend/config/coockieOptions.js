const isProd = process.env.NODE_ENV === "production";

/**
 * Cookie options for auth token.
 * - In production over HTTPS, set Secure + SameSite=None to allow cross-site cookies (admin panel on another domain).
 * - In development (http://localhost), Secure must be false.
 */
const cookieOptions = {
  httpOnly: true,
  secure: isProd, // must be true for SameSite=None
  sameSite: isProd ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

module.exports = { cookieOptions };
