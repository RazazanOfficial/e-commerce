//? 🔵 Required Modules
const bcrypt = require("bcryptjs");
const UserModel = require("../models/userModel");

const ADMIN_ROLES = new Set(["admin", "developer"]);
const EDITABLE_USER_FIELDS = new Set([
  "firstName",
  "lastName",
  "name",
  "phone",
  "phoneVerifiedAt",
  "phoneVerified",
  "email",
  "emailVerifiedAt",
  "emailVerified",
  "password",
  "role",
  "address",
  "postalCode",
  "province",
  "city",
]);

const USER_PUBLIC_FIELDS =
  "_id firstName lastName name phone phoneVerifiedAt email emailVerifiedAt role address postalCode province city createdAt updatedAt";

const normalizePhone = (phone) => String(phone || "").replace(/\D/g, "");
const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const escapeRegex = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const normalizeVerificationDate = (value) => {
  if (value === true || value === "true") return new Date();
  if (value === false || value === "false" || value === null || value === "") return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};
const isAdminRole = (role) => ADMIN_ROLES.has(String(role || "").trim());

const toPublicUser = (user) => {
  if (!user) return null;
  const src = typeof user.toObject === "function" ? user.toObject() : user;
  const { password, __v, ...safeUser } = src;
  return safeUser;
};

const buildSafeUserUpdates = async (body = {}) => {
  const updates = {};
  const explicitVerification = { phone: false, email: false };
  const changedContact = { phone: false, email: false };

  for (const [key, value] of Object.entries(body || {})) {
    if (!EDITABLE_USER_FIELDS.has(key)) continue;

    if (key === "phoneVerifiedAt" || key === "phoneVerified") {
      updates.phoneVerifiedAt = normalizeVerificationDate(value);
      explicitVerification.phone = true;
      continue;
    }

    if (key === "emailVerifiedAt" || key === "emailVerified") {
      updates.emailVerifiedAt = normalizeVerificationDate(value);
      explicitVerification.email = true;
      continue;
    }

    if (key === "password") {
      const password = String(value || "");
      if (!password) continue;
      if (password.length < 6) {
        const err = new Error("پسورد باید حداقل ۶ کاراکتر باشد");
        err.statusCode = 400;
        throw err;
      }
      const salt = await bcrypt.genSalt(12);
      updates.password = await bcrypt.hash(password, salt);
      continue;
    }

    if (key === "role") {
      const role = String(value || "").trim();
      if (!Object.values(UserModel.USER_ROLES).includes(role)) {
        const err = new Error("نقش کاربر نامعتبر است");
        err.statusCode = 400;
        throw err;
      }
      updates.role = role;
      continue;
    }

    if (key === "phone") {
      const phone = normalizePhone(value);
      if (!/^09[0-9]{9}$/.test(phone)) {
        const err = new Error("شماره موبایل نامعتبر است");
        err.statusCode = 400;
        throw err;
      }
      updates.phone = phone;
      changedContact.phone = true;
      continue;
    }

    if (key === "email") {
      const email = normalizeEmail(value);
      if (!email) {
        updates.$unset = { ...(updates.$unset || {}), email: 1, emailVerifiedAt: 1 };
        changedContact.email = true;
        continue;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        const err = new Error("ایمیل نامعتبر است");
        err.statusCode = 400;
        throw err;
      }
      updates.email = email;
      changedContact.email = true;
      continue;
    }

    updates[key] = typeof value === "string" ? value.trim() : value;
  }

  if (changedContact.phone && !explicitVerification.phone) {
    updates.phoneVerifiedAt = null;
  }

  if (changedContact.email && !explicitVerification.email) {
    updates.emailVerifiedAt = null;
  }

  if (updates.$unset?.emailVerifiedAt) {
    delete updates.emailVerifiedAt;
  }

  if ((updates.firstName || updates.lastName) && !updates.name) {
    const firstName = updates.firstName || body.firstName || "";
    const lastName = updates.lastName || body.lastName || "";
    updates.name = [firstName, lastName].map((item) => String(item || "").trim()).filter(Boolean).join(" ");
  }

  return updates;
};

module.exports = {
  ADMIN_ROLES,
  USER_PUBLIC_FIELDS,
  buildSafeUserUpdates,
  escapeRegex,
  isAdminRole,
  normalizeEmail,
  normalizePhone,
  normalizeVerificationDate,
  toPublicUser,
};
