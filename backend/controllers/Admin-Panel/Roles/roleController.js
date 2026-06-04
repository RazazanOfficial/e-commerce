//? 🔵 Required Modules
const AdminRoleModel = require("../../../models/adminRoleModel");
const UserModel = require("../../../models/userModel");
const {
  canManageRoleKey,
  ensureSystemRoles,
  getRoleDefinition,
  isDeveloperRole,
  isSystemRoleKey,
  normalizeRoleKey,
} = require("../../../utils/roleService");

//* 🟢 Role Serializer
const serializeRole = async (role, actorAccess) => {
  const canAssign = await canManageRoleKey({ actorAccess, targetRoleKey: role.key });
  const isDeveloper = isDeveloperRole(role.key);
  const isOwner = normalizeRoleKey(role.key) === "owner";

  return {
    _id: role._id,
    name: role.name,
    key: role.key,
    level: role.level,
    description: role.description || "",
    isSystem: Boolean(role.isSystem),
    locked: Boolean(role.locked),
    hidden: Boolean(role.hidden),
    isActive: role.isActive !== false,
    canAssign,
    canEdit: !role.locked && actorAccess.level > Number(role.level || 0),
    canDelete: !role.locked && actorAccess.level > Number(role.level || 0),
    disabledReason: canAssign
      ? ""
      : isDeveloper
      ? "این نقش فقط به صورت خودکار برای توسعه‌دهنده اصلی فعال می‌شود"
      : isOwner
      ? "برای تخصیص Owner باید توسعه‌دهنده وارد پنل شود"
      : "این نقش هم‌سطح یا بالاتر از حساب شما است",
  };
};

//* 🟢 List Roles Controller
const listRolesController = async (req, res) => {
  try {
    await ensureSystemRoles();

    const filter = req.userAccess?.isDeveloper ? {} : { hidden: { $ne: true } };
    const roles = await AdminRoleModel.find(filter).sort({ level: -1, name: 1 }).lean();
    const data = await Promise.all(roles.map((role) => serializeRole(role, req.userAccess)));

    return res.json({
      data,
      success: true,
      error: false,
      message: "لیست نقش‌ها",
    });
  } catch (error) {
    //! 🔴 Handle Errors
    console.error("List roles error:", error);
    return res.status(500).json({
      data: null,
      success: false,
      error: true,
      message: "خطا در دریافت نقش‌ها",
    });
  }
};

//* 🟢 Create Role Controller
const createRoleController = async (req, res) => {
  try {
    await ensureSystemRoles();

    const name = String(req.body?.name || "").trim();
    const key = normalizeRoleKey(req.body?.key || name);
    const level = Number(req.body?.level);
    const description = String(req.body?.description || "").trim();

    if (!name || name.length < 2 || name.length > 80) {
      return res.status(400).json({ data: null, success: false, error: true, message: "نام نقش نامعتبر است" });
    }

    if (!/^[a-z][a-z0-9-]{1,48}$/.test(key)) {
      return res.status(400).json({ data: null, success: false, error: true, message: "کلید نقش نامعتبر است" });
    }

    if (isSystemRoleKey(key)) {
      return res.status(400).json({ data: null, success: false, error: true, message: "این کلید برای نقش‌های سیستمی رزرو شده است" });
    }

    if (!Number.isFinite(level) || level < 1 || level >= req.userAccess.level) {
      return res.status(400).json({ data: null, success: false, error: true, message: "سطح نقش باید پایین‌تر از سطح حساب شما باشد" });
    }

    const role = await AdminRoleModel.create({
      name,
      key,
      level,
      description,
      createdBy: req.user.id,
      updatedBy: req.user.id,
    });

    return res.status(201).json({
      data: await serializeRole(role.toObject(), req.userAccess),
      success: true,
      error: false,
      message: "نقش جدید ساخته شد",
    });
  } catch (error) {
    //! 🔴 Handle Errors
    const statusCode = error?.code === 11000 ? 409 : 500;
    return res.status(statusCode).json({
      data: null,
      success: false,
      error: true,
      message: statusCode === 409 ? "کلید نقش تکراری است" : "خطا در ساخت نقش",
    });
  }
};

//* 🟢 Update Role Controller
const updateRoleController = async (req, res) => {
  try {
    const role = await AdminRoleModel.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ data: null, success: false, error: true, message: "نقش پیدا نشد" });
    }

    if (role.locked || role.isSystem) {
      return res.status(403).json({ data: null, success: false, error: true, message: "نقش سیستمی قابل ویرایش نیست" });
    }

    const currentRole = await getRoleDefinition(role.key);
    if (req.userAccess.level <= Number(currentRole?.level || 0)) {
      return res.status(403).json({ data: null, success: false, error: true, message: "نقش هم‌سطح یا بالاتر قابل ویرایش نیست" });
    }

    if (Object.prototype.hasOwnProperty.call(req.body || {}, "name")) {
      const name = String(req.body.name || "").trim();
      if (!name || name.length < 2 || name.length > 80) {
        return res.status(400).json({ data: null, success: false, error: true, message: "نام نقش نامعتبر است" });
      }
      role.name = name;
    }

    if (Object.prototype.hasOwnProperty.call(req.body || {}, "description")) {
      role.description = String(req.body.description || "").trim();
    }

    if (Object.prototype.hasOwnProperty.call(req.body || {}, "level")) {
      const level = Number(req.body.level);
      if (!Number.isFinite(level) || level < 1 || level >= req.userAccess.level) {
        return res.status(400).json({ data: null, success: false, error: true, message: "سطح نقش باید پایین‌تر از سطح حساب شما باشد" });
      }
      role.level = level;
    }

    if (Object.prototype.hasOwnProperty.call(req.body || {}, "isActive")) {
      role.isActive = Boolean(req.body.isActive);
    }

    role.updatedBy = req.user.id;
    await role.save();

    return res.json({
      data: await serializeRole(role.toObject(), req.userAccess),
      success: true,
      error: false,
      message: "نقش بروزرسانی شد",
    });
  } catch (error) {
    //! 🔴 Handle Errors
    return res.status(500).json({
      data: null,
      success: false,
      error: true,
      message: "خطا در ویرایش نقش",
    });
  }
};

//* 🟢 Delete Role Controller
const deleteRoleController = async (req, res) => {
  try {
    const role = await AdminRoleModel.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ data: null, success: false, error: true, message: "نقش پیدا نشد" });
    }

    if (role.locked || role.isSystem) {
      return res.status(403).json({ data: null, success: false, error: true, message: "نقش سیستمی قابل حذف نیست" });
    }

    if (req.userAccess.level <= Number(role.level || 0)) {
      return res.status(403).json({ data: null, success: false, error: true, message: "نقش هم‌سطح یا بالاتر قابل حذف نیست" });
    }

    const usedCount = await UserModel.countDocuments({ role: role.key });
    if (usedCount > 0) {
      return res.status(409).json({ data: null, success: false, error: true, message: "این نقش به کاربر اختصاص داده شده است" });
    }

    await role.deleteOne();

    return res.json({
      data: { id: req.params.id },
      success: true,
      error: false,
      message: "نقش حذف شد",
    });
  } catch (error) {
    //! 🔴 Handle Errors
    return res.status(500).json({
      data: null,
      success: false,
      error: true,
      message: "خطا در حذف نقش",
    });
  }
};

//? 🔵 Export Controllers
module.exports = {
  createRoleController,
  deleteRoleController,
  listRolesController,
  updateRoleController,
};
