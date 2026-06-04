//? 🔵 Required Modules
const AdminRoleModel = require("../models/adminRoleModel");
const UserModel = require("../models/userModel");

const { SYSTEM_ROLE_KEYS, SYSTEM_ROLE_DEFINITIONS } = AdminRoleModel;

const ADMIN_ACCESS_MIN_LEVEL = 500;
const RESERVED_ROLE_KEYS = new Set(Object.values(SYSTEM_ROLE_KEYS));
const BOOTSTRAP_DEVELOPER = Object.freeze({
  firstName: "meraj",
  lastName: "razazan",
  phone: "09333668229",
});

//* 🟢 Role Helpers
const normalizeRoleKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const normalizeName = (value) => String(value || "").trim().toLowerCase();
const normalizePhone = (value) => String(value || "").replace(/\D/g, "");
const isDeveloperRole = (role) => normalizeRoleKey(role) === SYSTEM_ROLE_KEYS.DEVELOPER;
const isSystemRoleKey = (role) => RESERVED_ROLE_KEYS.has(normalizeRoleKey(role));

const isBootstrapDeveloperIdentity = ({ firstName, lastName, phone } = {}) =>
  normalizeName(firstName) === BOOTSTRAP_DEVELOPER.firstName &&
  normalizeName(lastName) === BOOTSTRAP_DEVELOPER.lastName &&
  normalizePhone(phone) === BOOTSTRAP_DEVELOPER.phone;

const getBootstrapRoleForUser = (payload = {}) =>
  isBootstrapDeveloperIdentity(payload) ? SYSTEM_ROLE_KEYS.DEVELOPER : SYSTEM_ROLE_KEYS.USER;

const getStaticRoleDefinition = (role) => SYSTEM_ROLE_DEFINITIONS[normalizeRoleKey(role)] || null;

const ensureSystemRoles = async () => {
  const definitions = Object.values(SYSTEM_ROLE_DEFINITIONS);
  await Promise.all(
    definitions.map((role) =>
      AdminRoleModel.updateOne(
        { key: role.key },
        {
          $set: {
            name: role.name,
            level: role.level,
            description: role.description,
            isSystem: true,
            locked: true,
            hidden: role.hidden,
            isActive: true,
          },
          $setOnInsert: { key: role.key },
        },
        { upsert: true }
      )
    )
  );
};

const getRoleDefinition = async (role) => {
  const key = normalizeRoleKey(role);
  if (!key) return SYSTEM_ROLE_DEFINITIONS[SYSTEM_ROLE_KEYS.USER];

  const staticRole = getStaticRoleDefinition(key);
  const dbRole = await AdminRoleModel.findOne({ key }).lean();

  if (dbRole) return dbRole;
  if (staticRole) return staticRole;
  return null;
};

const getUserAccess = async (userId) => {
  const user = await UserModel.findById(userId).select("_id firstName lastName name phone role");
  if (!user) return null;

  if (isBootstrapDeveloperIdentity(user) && user.role !== SYSTEM_ROLE_KEYS.DEVELOPER) {
    user.role = SYSTEM_ROLE_KEYS.DEVELOPER;
    await user.save();
  }

  const role = await getRoleDefinition(user.role);
  const level = role?.isActive === false ? 0 : Number(role?.level || 0);

  return {
    user,
    role,
    roleKey: normalizeRoleKey(user.role),
    level,
    canAccessAdmin: level >= ADMIN_ACCESS_MIN_LEVEL,
    isDeveloper: isDeveloperRole(user.role),
  };
};

const attachRoleMeta = async (user) => {
  if (!user) return null;
  const src = typeof user.toObject === "function" ? user.toObject() : { ...user };
  const role = await getRoleDefinition(src.role);

  return {
    ...src,
    roleMeta: role
      ? {
          name: role.name,
          key: role.key,
          level: role.level,
          isSystem: Boolean(role.isSystem),
          locked: Boolean(role.locked),
          hidden: Boolean(role.hidden),
          isActive: role.isActive !== false,
        }
      : null,
    isAdmin: Number(role?.level || 0) >= ADMIN_ACCESS_MIN_LEVEL,
  };
};

const filterHiddenDeveloperQuery = (actorAccess) =>
  actorAccess?.isDeveloper ? {} : { role: { $ne: SYSTEM_ROLE_KEYS.DEVELOPER } };

const canManageRoleKey = async ({ actorAccess, targetRoleKey }) => {
  const key = normalizeRoleKey(targetRoleKey);
  if (!actorAccess?.canAccessAdmin) return false;
  if (key === SYSTEM_ROLE_KEYS.DEVELOPER) return false;

  const targetRole = await getRoleDefinition(key);
  if (!targetRole || targetRole.isActive === false) return false;

  return actorAccess.level > Number(targetRole.level || 0);
};

const assertCanManageUser = async ({ actorAccess, targetUser, nextRoleKey = null }) => {
  if (!actorAccess?.canAccessAdmin) {
    const err = new Error("شما اجازه مدیریت کاربران را ندارید");
    err.statusCode = 403;
    throw err;
  }

  if (!targetUser) {
    const err = new Error("کاربر پیدا نشد");
    err.statusCode = 404;
    throw err;
  }

  if (String(actorAccess.user._id) === String(targetUser._id)) {
    const err = new Error("امکان تغییر دسترسی حساب خودتان وجود ندارد");
    err.statusCode = 400;
    throw err;
  }

  if (isDeveloperRole(targetUser.role)) {
    const err = new Error("حساب توسعه‌دهنده از این مسیر قابل تغییر نیست");
    err.statusCode = 403;
    throw err;
  }

  const currentTargetRole = await getRoleDefinition(targetUser.role);
  if (actorAccess.level <= Number(currentTargetRole?.level || 0)) {
    const err = new Error("فقط نقش‌های پایین‌تر از سطح خودتان قابل مدیریت هستند");
    err.statusCode = 403;
    throw err;
  }

  if (nextRoleKey && !(await canManageRoleKey({ actorAccess, targetRoleKey: nextRoleKey }))) {
    const err = new Error("این نقش توسط حساب شما قابل تخصیص نیست");
    err.statusCode = 403;
    throw err;
  }
};

module.exports = {
  ADMIN_ACCESS_MIN_LEVEL,
  BOOTSTRAP_DEVELOPER,
  SYSTEM_ROLE_KEYS,
  SYSTEM_ROLE_DEFINITIONS,
  attachRoleMeta,
  canManageRoleKey,
  ensureSystemRoles,
  filterHiddenDeveloperQuery,
  getBootstrapRoleForUser,
  getRoleDefinition,
  getUserAccess,
  isBootstrapDeveloperIdentity,
  isDeveloperRole,
  isSystemRoleKey,
  normalizeRoleKey,
  assertCanManageUser,
};
