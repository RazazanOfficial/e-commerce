//? 🔵 Environment Flags
const isProd = process.env.NODE_ENV === "production";


//* 🟢 Cookie Options
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

//? 🔵 Export Config
module.exports = { cookieOptions };
