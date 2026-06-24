//? 🔵 Required Modules
const { escapeRegex, USER_PUBLIC_FIELDS } = require("./userSecurity");

const USER_SORTS = Object.freeze({
  LATEST: "latest",
  OLDEST: "oldest",
  ADMINS_FIRST: "admins_first",
  COMPLETED_PROFILE: "completed_profile",
});

const SYSTEM_USER_ROLES = Object.freeze(["developer"]);
const PROFILE_FIELDS = ["firstName", "lastName", "phone", "province", "city", "address", "postalCode"];

const normalizeUserSort = (sort) => {
  const value = String(sort || "").trim();
  return Object.values(USER_SORTS).includes(value) ? value : USER_SORTS.LATEST;
};

const buildPublicProjection = () =>
  USER_PUBLIC_FIELDS.split(/\s+/).reduce((projection, field) => {
    if (field) projection[field] = 1;
    return projection;
  }, {});

const compactFilters = (filters = []) =>
  filters.filter((filter) => filter && typeof filter === "object" && Object.keys(filter).length);

const combineUserFilters = (...filters) => {
  const validFilters = compactFilters(filters);
  if (!validFilters.length) return {};
  if (validFilters.length === 1) return validFilters[0];
  return { $and: validFilters };
};

const buildManageableUsersFilter = () => ({
  role: { $nin: SYSTEM_USER_ROLES },
});

const buildSearchFilter = (query) => {
  const value = String(query || "").trim();
  if (!value) return {};

  const searchRegex = new RegExp(escapeRegex(value), "i");

  return {
    $or: [
      { firstName: { $regex: searchRegex } },
      { lastName: { $regex: searchRegex } },
      { name: { $regex: searchRegex } },
      { email: { $regex: searchRegex } },
      { phone: { $regex: searchRegex } },
    ],
  };
};

const buildProfileScoreExpression = () => ({
  $add: [
    ...PROFILE_FIELDS.map((field) => ({
      $cond: [{ $gt: [{ $strLenCP: { $ifNull: [`$${field}`, ""] } }, 0] }, 1, 0],
    })),
    { $cond: [{ $ne: ["$phoneVerifiedAt", null] }, 1, 0] },
  ],
});

const buildSortStages = (sort) => {
  const normalizedSort = normalizeUserSort(sort);

  if (normalizedSort === USER_SORTS.OLDEST) {
    return [{ $sort: { createdAt: 1, _id: 1 } }];
  }

  if (normalizedSort === USER_SORTS.ADMINS_FIRST) {
    return [
      { $addFields: { _roleOrder: { $cond: [{ $eq: ["$role", "admin"] }, 0, 1] } } },
      { $sort: { _roleOrder: 1, createdAt: -1, _id: -1 } },
    ];
  }

  if (normalizedSort === USER_SORTS.COMPLETED_PROFILE) {
    return [
      { $addFields: { _profileScore: buildProfileScoreExpression() } },
      { $sort: { _profileScore: -1, createdAt: -1, _id: -1 } },
    ];
  }

  return [{ $sort: { createdAt: -1, _id: -1 } }];
};

const buildUserListPipeline = ({ filter = {}, sort, skip = 0, limit = 10 }) => [
  { $match: filter },
  ...buildSortStages(sort),
  { $skip: skip },
  { $limit: limit },
  { $project: buildPublicProjection() },
];

module.exports = {
  SYSTEM_USER_ROLES,
  USER_SORTS,
  buildManageableUsersFilter,
  buildSearchFilter,
  buildUserListPipeline,
  combineUserFilters,
  normalizeUserSort,
};
