//? 🔵 Required Modules
const swaggerUi = require("swagger-ui-express");

//? 🔵 Swagger Metadata
const apiVersion = process.env.API_VERSION || "1.0.0";
const port = process.env.PORT || 9999;
const serverUrl = process.env.SWAGGER_SERVER_URL || `http://localhost:${port}`;

//* 🟢 OpenAPI Specification
const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "E-Commerce API",
    version: apiVersion,
    description: "Backend API documentation for the e-commerce project.",
  },
  servers: [
    {
      url: serverUrl,
      description: "Configured backend server",
    },
  ],
  tags: [
    { name: "Auth" },
    { name: "Storefront Products" },
    { name: "Admin Users" },
    { name: "Admin Roles" },
    { name: "Admin Categories" },
    { name: "Admin Products" },
    { name: "Option Catalogs" },
    { name: "Tag Catalogs" },
    { name: "Currency Catalogs" },
    { name: "Media" },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "token",
        description: "JWT stored in the httpOnly token cookie after login.",
      },
    },
    parameters: {
      PageParam: {
        name: "page",
        in: "query",
        schema: { type: "integer", minimum: 1, default: 1 },
      },
      Limit10Max100Param: {
        name: "limit",
        in: "query",
        schema: { type: "integer", minimum: 1, maximum: 100, default: 10 },
      },
      Limit20Max100Param: {
        name: "limit",
        in: "query",
        schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
      },
      Limit20Max60Param: {
        name: "limit",
        in: "query",
        schema: { type: "integer", minimum: 1, maximum: 60, default: 20 },
      },
      Limit30Max200Param: {
        name: "limit",
        in: "query",
        schema: { type: "integer", minimum: 1, maximum: 200, default: 30 },
      },
      Limit50Max200Param: {
        name: "limit",
        in: "query",
        schema: { type: "integer", minimum: 1, maximum: 200, default: 50 },
      },
      IdParam: {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string" },
      },
      SlugParam: {
        name: "slug",
        in: "path",
        required: true,
        schema: { type: "string" },
      },
      ActiveQueryParam: {
        name: "isActive",
        in: "query",
        schema: { type: "string", enum: ["true", "false"] },
      },
      SearchQueryParam: {
        name: "q",
        in: "query",
        schema: { type: "string" },
      },
      KindQueryParam: {
        name: "kind",
        in: "query",
        schema: { type: "string", enum: ["image", "video", "gif", "other"] },
      },
    },
    schemas: {
      ApiSuccess: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          error: { type: "boolean", example: false },
          message: { type: "string" },
          data: {},
        },
      },
      ApiError: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: { type: "boolean", example: true },
          message: { type: "string" },
          data: { nullable: true },
        },
      },
      PublicUser: {
        type: "object",
        properties: {
          _id: { type: "string" },
          firstName: { type: "string" },
          lastName: { type: "string" },
          name: { type: "string" },
          phone: { type: "string" },
          phoneVerifiedAt: { type: "string", format: "date-time", nullable: true },
          email: { type: "string", format: "email", nullable: true },
          emailVerifiedAt: { type: "string", format: "date-time", nullable: true },
          role: { type: "string", example: "user", description: "Dynamic role key. Developer is never assignable through public admin APIs." },
          address: { type: "string" },
          postalCode: { type: "string" },
          province: { type: "string" },
          city: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      RegisterCodeRequestInput: {
        type: "object",
        required: ["firstName", "lastName", "phone"],
        properties: {
          firstName: { type: "string", example: "معراج" },
          lastName: { type: "string", example: "رزازان" },
          phone: { type: "string", pattern: "^09[0-9]{9}$", example: "09333668229" },
        },
        additionalProperties: false,
      },
      RegisterCodeVerifyInput: {
        type: "object",
        required: ["firstName", "lastName", "phone", "code", "password", "confirmPassword"],
        properties: {
          firstName: { type: "string", example: "معراج" },
          lastName: { type: "string", example: "رزازان" },
          phone: { type: "string", pattern: "^09[0-9]{9}$", example: "09333668229" },
          code: { type: "string", pattern: "^[0-9]{6}$", example: "123456" },
          password: {
            type: "string",
            format: "password",
            minLength: 6,
            pattern: "^(?=.*[A-Za-z])(?=.*\\d).{6,}$",
            example: "Anita82",
          },
          confirmPassword: {
            type: "string",
            format: "password",
            minLength: 6,
            example: "Anita82",
          },
        },
        additionalProperties: false,
      },
      LoginInput: {
        type: "object",
        required: ["phoneOrEmail", "password"],
        properties: {
          phoneOrEmail: { type: "string", example: "razazanOfficial@gmail.com" },
          password: { type: "string", format: "password", example: "Anitalove82@" },
        },
      },
      UserUpdateInput: {
        type: "object",
        properties: {
          firstName: { type: "string" },
          lastName: { type: "string" },
          name: { type: "string" },
          phone: { type: "string", pattern: "^09[0-9]{9}$" },
          email: { type: "string", format: "email" },
          password: { type: "string", format: "password", minLength: 6 },
          role: { type: "string", example: "user", description: "Dynamic role key. Developer is never assignable through public admin APIs." },
          address: { type: "string" },
          postalCode: { type: "string" },
          province: { type: "string" },
          city: { type: "string" },
        },
        additionalProperties: false,
      },

      AdminRole: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          key: { type: "string", example: "sub-owner" },
          level: { type: "number", example: 850 },
          description: { type: "string" },
          isSystem: { type: "boolean" },
          locked: { type: "boolean" },
          hidden: { type: "boolean" },
          isActive: { type: "boolean" },
          canAssign: { type: "boolean" },
          canEdit: { type: "boolean" },
          canDelete: { type: "boolean" },
          disabledReason: { type: "string" },
        },
      },
      AdminRoleCreateInput: {
        type: "object",
        required: ["name", "level"],
        properties: {
          name: { type: "string", example: "Sub Owner" },
          key: { type: "string", pattern: "^[a-z][a-z0-9-]{1,48}$", example: "sub-owner" },
          level: { type: "number", minimum: 1, maximum: 999, example: 850 },
          description: { type: "string" },
        },
        additionalProperties: false,
      },
      AdminRoleUpdateInput: {
        type: "object",
        properties: {
          name: { type: "string" },
          level: { type: "number", minimum: 1, maximum: 999 },
          description: { type: "string" },
          isActive: { type: "boolean" },
        },
        additionalProperties: false,
      },
      CategoryCreateInput: {
        type: "object",
        required: ["name", "slug"],
        properties: {
          name: { type: "string", example: "Digital Products" },
          slug: { type: "string", pattern: "^[a-z0-9-]+$", example: "digital-products" },
          description: { type: "string" },
          image: { type: "string" },
          imageAlt: { type: "string" },
          isActive: { type: "boolean", default: true },
          metaTitle: { type: "string" },
          metaDescription: { type: "string" },
          keywords: { oneOf: [{ type: "array", items: { type: "string" } }, { type: "string" }] },
          parent: { type: "string", nullable: true, description: "Category ObjectId, name, slug, null, or empty string." },
        },
        additionalProperties: false,
      },
      CategoryUpdateInput: {
        type: "object",
        properties: {
          name: { type: "string" },
          slug: { type: "string", pattern: "^[a-z0-9-]+$" },
          description: { type: "string" },
          image: { type: "string" },
          imageAlt: { type: "string" },
          isActive: { type: "boolean" },
          sortOrder: { type: "integer", minimum: 1 },
          parent: { type: "string", nullable: true },
          metaTitle: { type: "string" },
          metaDescription: { type: "string" },
          keywords: { oneOf: [{ type: "array", items: { type: "string" } }, { type: "string" }] },
        },
        additionalProperties: false,
      },
      InventoryInput: {
        type: "object",
        properties: {
          manage: { type: "boolean", default: true },
          qty: { type: "integer", minimum: 0, default: 0 },
        },
      },
      MediaImageInput: {
        type: "object",
        required: ["url", "alt"],
        properties: {
          url: { type: "string" },
          alt: { type: "string", maxLength: 120 },
          isPrimary: { type: "boolean", default: false },
          variants: {
            type: "object",
            properties: {
              thumb: { type: "string" },
              md: { type: "string" },
              lg: { type: "string" },
            },
          },
        },
      },
      UnifiedMediaInput: {
        type: "object",
        required: ["type"],
        properties: {
          type: { type: "string", enum: ["image", "video", "gif", "embed"] },
          key: { type: "string" },
          url: { type: "string" },
          posterKey: { type: "string" },
          posterUrl: { type: "string" },
          alt: { type: "string", maxLength: 120 },
          isPrimary: { type: "boolean", default: false },
          order: { type: "integer", default: 0 },
        },
      },
      ProductInput: {
        type: "object",
        description: "Draft products can be partial. ACTIVE products require title, slug, shortDescription, categoryId, price, currency, and one primary image/media item.",
        properties: {
          title: { type: "string", maxLength: 120, example: "Sample Product" },
          slug: { type: "string", pattern: "^[a-z0-9-]+$", example: "sample-product" },
          shortDescription: { type: "string", maxLength: 160 },
          overviewHtml: { type: "string" },
          categoryId: { type: "string" },
          brandId: { type: "string" },
          tags: { oneOf: [{ type: "array", items: { type: "string" } }, { type: "string" }] },
          status: { type: "string", enum: ["DRAFT", "ACTIVE", "ARCHIVED"], default: "DRAFT" },
          visible: { type: "boolean" },
          price: { type: "integer", minimum: 0, example: 1250000 },
          currency: { type: "string", example: "IRT" },
          compareAt: { type: "integer", minimum: 0 },
          cost: { type: "integer", minimum: 0 },
          inventory: { $ref: "#/components/schemas/InventoryInput" },
          stockStatus: { type: "string", enum: ["IN_STOCK", "OUT_OF_STOCK", "PREORDER"] },
          lowStockThreshold: { type: "integer", minimum: 0 },
          publishAt: { type: "string", format: "date-time" },
          allowBackorder: { type: "boolean" },
          restockNotifyEnabled: { type: "boolean" },
          hasVariants: { type: "boolean" },
          options: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                values: { type: "array", items: { type: "string" } },
              },
            },
          },
          variants: { type: "array", items: { type: "object" } },
          media: { type: "array", items: { $ref: "#/components/schemas/UnifiedMediaInput" } },
          images: { type: "array", items: { $ref: "#/components/schemas/MediaImageInput" } },
          videos: { type: "array", items: { type: "object" } },
          attributes: {
            type: "array",
            items: {
              type: "object",
              required: ["key", "value"],
              properties: {
                key: { type: "string" },
                value: { type: "string" },
                pinToHero: { type: "boolean" },
              },
            },
          },
          techSpecs: { type: "array", items: { type: "object" } },
          faqs: { type: "array", items: { type: "object" } },
          seo: { type: "object" },
          shipping: { type: "object" },
          warranty: { type: "string" },
          returnPolicy: { type: "object" },
          handlingTime: { type: "object" },
          related: { type: "object" },
          breadcrumbsCache: { type: "array", items: { type: "object" } },
        },
      },
      OptionCatalogInput: {
        type: "object",
        required: ["name", "code"],
        properties: {
          name: { type: "string", example: "Color" },
          code: { type: "string", pattern: "^[a-z0-9-]+$", example: "color" },
          values: { oneOf: [{ type: "array", items: { type: "string" } }, { type: "string" }], example: ["Black", "White"] },
          isActive: { type: "boolean", default: true },
        },
        additionalProperties: false,
      },
      TagCatalogInput: {
        type: "object",
        required: ["label"],
        properties: {
          label: { type: "string", example: "New" },
          name: { type: "string", description: "Alias for label." },
          title: { type: "string", description: "Alias for label." },
          key: { type: "string", example: "new" },
          isActive: { type: "boolean", default: true },
        },
      },
      TagToggleInput: {
        type: "object",
        properties: {
          isActive: { type: "boolean" },
        },
      },
      CurrencyCatalogInput: {
        type: "object",
        required: ["nameFa", "code"],
        properties: {
          nameFa: { type: "string", example: "تومان" },
          code: { type: "string", pattern: "^[A-Z0-9_]{2,10}$", example: "IRT" },
          symbol: { type: "string", example: "ت" },
          isActive: { type: "boolean", default: true },
          sortOrder: { type: "integer", example: 1 },
        },
        additionalProperties: false,
      },
      MediaPresignInput: {
        type: "object",
        required: ["mimeType"],
        properties: {
          mimeType: {
            type: "string",
            enum: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm", "video/quicktime"],
            example: "image/webp",
          },
          expiresInSec: { type: "integer", minimum: 60, maximum: 3600, default: 300 },
        },
      },
      MediaCommitInput: {
        type: "object",
        required: ["key"],
        properties: {
          key: { type: "string", example: "uploads/1710000000000-abcdef12.webp" },
          originalName: { type: "string", example: "product.webp" },
          kind: { type: "string", enum: ["image", "video", "gif", "other"], example: "image" },
        },
      },
      MediaDeleteInput: {
        type: "object",
        required: ["key"],
        properties: {
          key: { type: "string", example: "uploads/1710000000000-abcdef12.webp" },
          force: { oneOf: [{ type: "boolean" }, { type: "string", enum: ["true", "false", "1", "0", "yes", "no", "on", "off"] }], default: false },
        },
      },
    },
    responses: {
      BadRequest: {
        description: "Invalid request.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
      },
      Unauthorized: {
        description: "Authentication is required.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
      },
      Forbidden: {
        description: "Admin or developer role is required.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
      },
      NotFound: {
        description: "Resource was not found.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
      },
      Conflict: {
        description: "Request conflicts with existing data or usage constraints.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
      },
      ServerError: {
        description: "Unexpected server error.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
      },
    },
  },
  paths: {},
};

//* 🟢 Path Helpers
const jsonBody = (schemaRef, required = true) => ({
  required,
  content: {
    "application/json": {
      schema: { $ref: schemaRef },
    },
  },
});

const successResponse = (description = "Successful request") => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ApiSuccess" },
    },
  },
});

const secured = [{ cookieAuth: [] }];

const adminResponses = {
  401: { $ref: "#/components/responses/Unauthorized" },
  403: { $ref: "#/components/responses/Forbidden" },
  500: { $ref: "#/components/responses/ServerError" },
};

const idParam = { $ref: "#/components/parameters/IdParam" };
const pageParam = { $ref: "#/components/parameters/PageParam" };
const qParam = { $ref: "#/components/parameters/SearchQueryParam" };
const activeParam = { $ref: "#/components/parameters/ActiveQueryParam" };

//* 🟢 Auth Paths
Object.assign(swaggerSpec.paths, {
  "/api/register": {
    post: {
      tags: ["Auth"],
      summary: "Request registration OTP code",
      requestBody: jsonBody("#/components/schemas/RegisterCodeRequestInput"),
      responses: {
        200: successResponse("Registration code sent successfully."),
        400: { $ref: "#/components/responses/BadRequest" },
        409: { $ref: "#/components/responses/Conflict" },
        500: { $ref: "#/components/responses/ServerError" },
      },
    },
  },
  "/api/register/request-code": {
    post: {
      tags: ["Auth"],
      summary: "Request registration OTP code",
      requestBody: jsonBody("#/components/schemas/RegisterCodeRequestInput"),
      responses: {
        200: successResponse("Registration code sent successfully."),
        400: { $ref: "#/components/responses/BadRequest" },
        409: { $ref: "#/components/responses/Conflict" },
        500: { $ref: "#/components/responses/ServerError" },
      },
    },
  },
  "/api/register/verify-code": {
    post: {
      tags: ["Auth"],
      summary: "Verify registration OTP and auto-login the new user",
      requestBody: jsonBody("#/components/schemas/RegisterCodeVerifyInput"),
      responses: {
        201: successResponse("User registered and logged in successfully."),
        400: { $ref: "#/components/responses/BadRequest" },
        409: { $ref: "#/components/responses/Conflict" },
        429: { description: "Too many OTP attempts." },
        500: { $ref: "#/components/responses/ServerError" },
      },
    },
  },
  "/api/login": {
    post: {
      tags: ["Auth"],
      summary: "Login and set the auth cookie",
      requestBody: jsonBody("#/components/schemas/LoginInput"),
      responses: {
        200: successResponse("User logged in successfully."),
        400: { $ref: "#/components/responses/BadRequest" },
        500: { $ref: "#/components/responses/ServerError" },
      },
    },
  },
  "/api/user-details": {
    get: {
      tags: ["Auth"],
      summary: "Get authenticated user details",
      security: secured,
      responses: {
        200: successResponse("Authenticated user details."),
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { $ref: "#/components/responses/NotFound" },
        500: { $ref: "#/components/responses/ServerError" },
      },
    },
  },
  "/api/logout": {
    get: {
      tags: ["Auth"],
      summary: "Logout and clear the auth cookie",
      responses: {
        200: successResponse("User logged out successfully."),
        500: { $ref: "#/components/responses/ServerError" },
      },
    },
  },
});

//* 🟢 Storefront Product Paths
Object.assign(swaggerSpec.paths, {
  "/api/products": {
    get: {
      tags: ["Storefront Products"],
      summary: "List public active products",
      parameters: [
        pageParam,
        { $ref: "#/components/parameters/Limit20Max60Param" },
        { name: "sort", in: "query", schema: { type: "string", enum: ["newest", "oldest", "price_asc", "price_desc"], default: "newest" } },
        { name: "categoryId", in: "query", schema: { type: "string" } },
        { name: "categorySlug", in: "query", schema: { type: "string" } },
        qParam,
      ],
      responses: { 200: successResponse(), 500: { $ref: "#/components/responses/ServerError" } },
    },
  },
  "/api/products/{slug}": {
    get: {
      tags: ["Storefront Products"],
      summary: "Get a public active product by slug",
      parameters: [{ $ref: "#/components/parameters/SlugParam" }],
      responses: {
        200: successResponse(),
        400: { $ref: "#/components/responses/BadRequest" },
        404: { $ref: "#/components/responses/NotFound" },
        500: { $ref: "#/components/responses/ServerError" },
      },
    },
  },
});

//* 🟢 Admin User Paths
Object.assign(swaggerSpec.paths, {
  "/api/admin/all-users": {
    get: {
      tags: ["Admin Users"],
      summary: "List users",
      security: secured,
      parameters: [pageParam, { $ref: "#/components/parameters/Limit10Max100Param" }],
      responses: { 200: successResponse(), ...adminResponses },
    },
  },
  "/api/admin/search-users": {
    get: {
      tags: ["Admin Users"],
      summary: "Search users by name, phone, email, role, address, or postal code",
      security: secured,
      parameters: [qParam, pageParam, { $ref: "#/components/parameters/Limit20Max100Param" }],
      responses: {
        200: successResponse(),
        400: { $ref: "#/components/responses/BadRequest" },
        ...adminResponses,
      },
    },
  },
  "/api/admin/user/{id}": {
    get: {
      tags: ["Admin Users"],
      summary: "Get a user by id",
      security: secured,
      parameters: [idParam],
      responses: { 200: successResponse(), 404: { $ref: "#/components/responses/NotFound" }, ...adminResponses },
    },
    put: {
      tags: ["Admin Users"],
      summary: "Update a user by id",
      security: secured,
      parameters: [idParam],
      requestBody: jsonBody("#/components/schemas/UserUpdateInput"),
      responses: {
        200: successResponse(),
        400: { $ref: "#/components/responses/BadRequest" },
        404: { $ref: "#/components/responses/NotFound" },
        409: { $ref: "#/components/responses/Conflict" },
        ...adminResponses,
      },
    },
    delete: {
      tags: ["Admin Users"],
      summary: "Delete a user by id",
      security: secured,
      parameters: [idParam],
      responses: { 200: successResponse(), 404: { $ref: "#/components/responses/NotFound" }, ...adminResponses },
    },
  },
});


//* 🟢 Admin Role Paths
Object.assign(swaggerSpec.paths, {
  "/api/admin/roles": {
    get: {
      tags: ["Admin Roles"],
      summary: "List visible role definitions",
      security: secured,
      responses: { 200: successResponse(), ...adminResponses },
    },
    post: {
      tags: ["Admin Roles"],
      summary: "Create a custom role below the current user's level",
      security: secured,
      requestBody: jsonBody("#/components/schemas/AdminRoleCreateInput"),
      responses: {
        201: successResponse("Role created successfully."),
        400: { $ref: "#/components/responses/BadRequest" },
        409: { $ref: "#/components/responses/Conflict" },
        ...adminResponses,
      },
    },
  },
  "/api/admin/roles/{id}": {
    put: {
      tags: ["Admin Roles"],
      summary: "Update a custom role",
      security: secured,
      parameters: [idParam],
      requestBody: jsonBody("#/components/schemas/AdminRoleUpdateInput"),
      responses: {
        200: successResponse(),
        400: { $ref: "#/components/responses/BadRequest" },
        404: { $ref: "#/components/responses/NotFound" },
        ...adminResponses,
      },
    },
    delete: {
      tags: ["Admin Roles"],
      summary: "Delete an unused custom role",
      security: secured,
      parameters: [idParam],
      responses: {
        200: successResponse(),
        404: { $ref: "#/components/responses/NotFound" },
        409: { $ref: "#/components/responses/Conflict" },
        ...adminResponses,
      },
    },
  },
});

//* 🟢 Admin Category Paths
Object.assign(swaggerSpec.paths, {
  "/api/admin/categories": {
    get: {
      tags: ["Admin Categories"],
      summary: "List categories",
      security: secured,
      responses: { 200: successResponse(), ...adminResponses },
    },
    post: {
      tags: ["Admin Categories"],
      summary: "Create a category",
      security: secured,
      requestBody: jsonBody("#/components/schemas/CategoryCreateInput"),
      responses: {
        201: successResponse(),
        400: { $ref: "#/components/responses/BadRequest" },
        409: { $ref: "#/components/responses/Conflict" },
        ...adminResponses,
      },
    },
  },
  "/api/admin/categories/{id}": {
    put: {
      tags: ["Admin Categories"],
      summary: "Update a category",
      security: secured,
      parameters: [idParam],
      requestBody: jsonBody("#/components/schemas/CategoryUpdateInput"),
      responses: {
        200: successResponse(),
        400: { $ref: "#/components/responses/BadRequest" },
        404: { $ref: "#/components/responses/NotFound" },
        409: { $ref: "#/components/responses/Conflict" },
        ...adminResponses,
      },
    },
    delete: {
      tags: ["Admin Categories"],
      summary: "Delete a category",
      security: secured,
      parameters: [idParam],
      responses: {
        200: successResponse(),
        400: { $ref: "#/components/responses/BadRequest" },
        404: { $ref: "#/components/responses/NotFound" },
        409: { $ref: "#/components/responses/Conflict" },
        ...adminResponses,
      },
    },
  },
});

//* 🟢 Admin Product Paths
Object.assign(swaggerSpec.paths, {
  "/api/admin/products": {
    get: {
      tags: ["Admin Products"],
      summary: "List admin products",
      security: secured,
      parameters: [
        pageParam,
        { $ref: "#/components/parameters/Limit20Max100Param" },
        { name: "status", in: "query", schema: { type: "string", enum: ["DRAFT", "ACTIVE", "ARCHIVED"] } },
        { name: "categoryId", in: "query", schema: { type: "string" } },
        { name: "visible", in: "query", schema: { type: "string", enum: ["true", "false"] } },
        { name: "search", in: "query", schema: { type: "string" } },
        qParam,
      ],
      responses: { 200: successResponse(), ...adminResponses },
    },
    post: {
      tags: ["Admin Products"],
      summary: "Create a product",
      security: secured,
      requestBody: jsonBody("#/components/schemas/ProductInput"),
      responses: {
        201: successResponse(),
        400: { $ref: "#/components/responses/BadRequest" },
        409: { $ref: "#/components/responses/Conflict" },
        ...adminResponses,
      },
    },
  },
  "/api/admin/products/search": {
    get: {
      tags: ["Admin Products"],
      summary: "Search admin products",
      security: secured,
      parameters: [
        { name: "q", in: "query", required: true, schema: { type: "string" } },
        pageParam,
        { $ref: "#/components/parameters/Limit20Max100Param" },
        { name: "status", in: "query", schema: { type: "string", enum: ["DRAFT", "ACTIVE", "ARCHIVED"] } },
        { name: "visible", in: "query", schema: { type: "string", enum: ["true", "false"] } },
      ],
      responses: {
        200: successResponse(),
        400: { $ref: "#/components/responses/BadRequest" },
        ...adminResponses,
      },
    },
  },
  "/api/admin/products/{id}": {
    get: {
      tags: ["Admin Products"],
      summary: "Get admin product by id",
      security: secured,
      parameters: [idParam],
      responses: {
        200: successResponse(),
        400: { $ref: "#/components/responses/BadRequest" },
        404: { $ref: "#/components/responses/NotFound" },
        ...adminResponses,
      },
    },
    put: {
      tags: ["Admin Products"],
      summary: "Update a product",
      security: secured,
      parameters: [idParam],
      requestBody: jsonBody("#/components/schemas/ProductInput"),
      responses: {
        200: successResponse(),
        400: { $ref: "#/components/responses/BadRequest" },
        404: { $ref: "#/components/responses/NotFound" },
        409: { $ref: "#/components/responses/Conflict" },
        ...adminResponses,
      },
    },
    delete: {
      tags: ["Admin Products"],
      summary: "Archive a product",
      security: secured,
      parameters: [idParam],
      responses: {
        200: successResponse(),
        400: { $ref: "#/components/responses/BadRequest" },
        404: { $ref: "#/components/responses/NotFound" },
        ...adminResponses,
      },
    },
  },
  "/api/admin/products/{id}/hard": {
    delete: {
      tags: ["Admin Products"],
      summary: "Permanently delete a product",
      security: secured,
      parameters: [idParam],
      responses: {
        200: successResponse(),
        400: { $ref: "#/components/responses/BadRequest" },
        404: { $ref: "#/components/responses/NotFound" },
        ...adminResponses,
      },
    },
  },
  "/api/admin/products/{id}/restore": {
    patch: {
      tags: ["Admin Products"],
      summary: "Restore an archived product to draft",
      security: secured,
      parameters: [idParam],
      responses: {
        200: successResponse(),
        400: { $ref: "#/components/responses/BadRequest" },
        404: { $ref: "#/components/responses/NotFound" },
        ...adminResponses,
      },
    },
  },
});

//* 🟢 Option Catalog Paths
Object.assign(swaggerSpec.paths, {
  "/api/admin/option-catalogs": {
    get: {
      tags: ["Option Catalogs"],
      summary: "List option catalogs",
      security: secured,
      parameters: [
        qParam,
        activeParam,
        pageParam,
        { $ref: "#/components/parameters/Limit50Max200Param" },
        { name: "sort", in: "query", schema: { type: "string", enum: ["name", "code", "isActive", "createdAt", "updatedAt"], default: "name" } },
        { name: "dir", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "asc" } },
      ],
      responses: { 200: successResponse(), ...adminResponses },
    },
    post: {
      tags: ["Option Catalogs"],
      summary: "Create an option catalog",
      security: secured,
      requestBody: jsonBody("#/components/schemas/OptionCatalogInput"),
      responses: { 201: successResponse(), 400: { $ref: "#/components/responses/BadRequest" }, 409: { $ref: "#/components/responses/Conflict" }, ...adminResponses },
    },
  },
  "/api/admin/option-catalogs/{id}": {
    get: {
      tags: ["Option Catalogs"],
      summary: "Get an option catalog by id",
      security: secured,
      parameters: [idParam],
      responses: { 200: successResponse(), 400: { $ref: "#/components/responses/BadRequest" }, 404: { $ref: "#/components/responses/NotFound" }, ...adminResponses },
    },
    put: {
      tags: ["Option Catalogs"],
      summary: "Update an option catalog",
      security: secured,
      parameters: [idParam],
      requestBody: jsonBody("#/components/schemas/OptionCatalogInput"),
      responses: { 200: successResponse(), 400: { $ref: "#/components/responses/BadRequest" }, 404: { $ref: "#/components/responses/NotFound" }, 409: { $ref: "#/components/responses/Conflict" }, ...adminResponses },
    },
    delete: {
      tags: ["Option Catalogs"],
      summary: "Delete an option catalog",
      security: secured,
      parameters: [idParam],
      responses: { 200: successResponse(), 400: { $ref: "#/components/responses/BadRequest" }, 404: { $ref: "#/components/responses/NotFound" }, 409: { $ref: "#/components/responses/Conflict" }, ...adminResponses },
    },
  },
  "/api/admin/option-catalogs/{id}/toggle": {
    patch: {
      tags: ["Option Catalogs"],
      summary: "Toggle an option catalog active status",
      security: secured,
      parameters: [idParam],
      responses: { 200: successResponse(), 400: { $ref: "#/components/responses/BadRequest" }, 404: { $ref: "#/components/responses/NotFound" }, ...adminResponses },
    },
  },
});

//* 🟢 Tag Catalog Paths
Object.assign(swaggerSpec.paths, {
  "/api/admin/tag-catalogs": {
    get: {
      tags: ["Tag Catalogs"],
      summary: "List tag catalogs",
      security: secured,
      parameters: [qParam, activeParam, pageParam, { $ref: "#/components/parameters/Limit50Max200Param" }],
      responses: { 200: successResponse(), ...adminResponses },
    },
    post: {
      tags: ["Tag Catalogs"],
      summary: "Create a tag catalog",
      security: secured,
      requestBody: jsonBody("#/components/schemas/TagCatalogInput"),
      responses: { 201: successResponse(), 400: { $ref: "#/components/responses/BadRequest" }, 409: { $ref: "#/components/responses/Conflict" }, ...adminResponses },
    },
  },
  "/api/admin/tag-catalogs/suggest": {
    get: {
      tags: ["Tag Catalogs"],
      summary: "Suggest active tags",
      security: secured,
      parameters: [qParam],
      responses: { 200: successResponse(), ...adminResponses },
    },
  },
  "/api/admin/tag-catalogs/{id}": {
    get: {
      tags: ["Tag Catalogs"],
      summary: "Get a tag catalog by id",
      security: secured,
      parameters: [idParam],
      responses: { 200: successResponse(), 404: { $ref: "#/components/responses/NotFound" }, ...adminResponses },
    },
    put: {
      tags: ["Tag Catalogs"],
      summary: "Update a tag catalog",
      security: secured,
      parameters: [idParam],
      requestBody: jsonBody("#/components/schemas/TagCatalogInput"),
      responses: { 200: successResponse(), 400: { $ref: "#/components/responses/BadRequest" }, 404: { $ref: "#/components/responses/NotFound" }, 409: { $ref: "#/components/responses/Conflict" }, ...adminResponses },
    },
    delete: {
      tags: ["Tag Catalogs"],
      summary: "Delete a tag catalog",
      security: secured,
      parameters: [idParam],
      responses: { 200: successResponse(), 404: { $ref: "#/components/responses/NotFound" }, 409: { $ref: "#/components/responses/Conflict" }, ...adminResponses },
    },
  },
  "/api/admin/tag-catalogs/{id}/toggle": {
    patch: {
      tags: ["Tag Catalogs"],
      summary: "Toggle or set a tag catalog active status",
      security: secured,
      parameters: [idParam],
      requestBody: jsonBody("#/components/schemas/TagToggleInput", false),
      responses: { 200: successResponse(), 404: { $ref: "#/components/responses/NotFound" }, ...adminResponses },
    },
  },
});

//* 🟢 Currency Catalog Paths
Object.assign(swaggerSpec.paths, {
  "/api/admin/currency-catalogs": {
    get: {
      tags: ["Currency Catalogs"],
      summary: "List currency catalogs",
      security: secured,
      parameters: [qParam, activeParam],
      responses: { 200: successResponse(), ...adminResponses },
    },
    post: {
      tags: ["Currency Catalogs"],
      summary: "Create a currency catalog",
      security: secured,
      requestBody: jsonBody("#/components/schemas/CurrencyCatalogInput"),
      responses: { 201: successResponse(), 400: { $ref: "#/components/responses/BadRequest" }, 409: { $ref: "#/components/responses/Conflict" }, ...adminResponses },
    },
  },
  "/api/admin/currency-catalogs/{id}": {
    get: {
      tags: ["Currency Catalogs"],
      summary: "Get a currency catalog by id",
      security: secured,
      parameters: [idParam],
      responses: { 200: successResponse(), 400: { $ref: "#/components/responses/BadRequest" }, 404: { $ref: "#/components/responses/NotFound" }, ...adminResponses },
    },
    put: {
      tags: ["Currency Catalogs"],
      summary: "Update a currency catalog",
      security: secured,
      parameters: [idParam],
      requestBody: jsonBody("#/components/schemas/CurrencyCatalogInput"),
      responses: { 200: successResponse(), 400: { $ref: "#/components/responses/BadRequest" }, 404: { $ref: "#/components/responses/NotFound" }, 409: { $ref: "#/components/responses/Conflict" }, ...adminResponses },
    },
    delete: {
      tags: ["Currency Catalogs"],
      summary: "Delete a currency catalog",
      security: secured,
      parameters: [idParam],
      responses: { 200: successResponse(), 400: { $ref: "#/components/responses/BadRequest" }, 404: { $ref: "#/components/responses/NotFound" }, 409: { $ref: "#/components/responses/Conflict" }, ...adminResponses },
    },
  },
  "/api/admin/currency-catalogs/{id}/toggle": {
    patch: {
      tags: ["Currency Catalogs"],
      summary: "Toggle a currency catalog active status",
      security: secured,
      parameters: [idParam],
      responses: { 200: successResponse(), 400: { $ref: "#/components/responses/BadRequest" }, 404: { $ref: "#/components/responses/NotFound" }, ...adminResponses },
    },
  },
});

//* 🟢 Media Paths
Object.assign(swaggerSpec.paths, {
  "/api/admin/media": {
    get: {
      tags: ["Media"],
      summary: "List committed media assets",
      security: secured,
      parameters: [pageParam, { $ref: "#/components/parameters/Limit30Max200Param" }, qParam, { $ref: "#/components/parameters/KindQueryParam" }],
      responses: { 200: successResponse(), ...adminResponses },
    },
    delete: {
      tags: ["Media"],
      summary: "Delete a media asset by key",
      security: secured,
      parameters: [
        { name: "key", in: "query", schema: { type: "string" }, description: "Alternative to request body key." },
        { name: "force", in: "query", schema: { type: "string", enum: ["true", "false", "1", "0", "yes", "no", "on", "off"] } },
      ],
      requestBody: jsonBody("#/components/schemas/MediaDeleteInput", false),
      responses: {
        200: successResponse(),
        400: { $ref: "#/components/responses/BadRequest" },
        409: { $ref: "#/components/responses/Conflict" },
        ...adminResponses,
      },
    },
  },
  "/api/admin/media/bucket": {
    get: {
      tags: ["Media"],
      summary: "List objects directly from the cloud bucket",
      security: secured,
      parameters: [
        { name: "prefix", in: "query", schema: { type: "string" } },
        { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 1000, default: 200 } },
        { $ref: "#/components/parameters/KindQueryParam" },
        { name: "continuationToken", in: "query", schema: { type: "string" } },
      ],
      responses: { 200: successResponse(), 400: { $ref: "#/components/responses/BadRequest" }, ...adminResponses },
    },
  },
  "/api/admin/media/presign": {
    post: {
      tags: ["Media"],
      summary: "Create a presigned upload URL",
      security: secured,
      requestBody: jsonBody("#/components/schemas/MediaPresignInput"),
      responses: { 200: successResponse(), 400: { $ref: "#/components/responses/BadRequest" }, ...adminResponses },
    },
  },
  "/api/admin/media/commit": {
    post: {
      tags: ["Media"],
      summary: "Commit an uploaded media asset",
      security: secured,
      requestBody: jsonBody("#/components/schemas/MediaCommitInput"),
      responses: { 200: successResponse(), 400: { $ref: "#/components/responses/BadRequest" }, ...adminResponses },
    },
  },
  "/api/admin/media/{id}": {
    delete: {
      tags: ["Media"],
      summary: "Delete a media asset by id",
      security: secured,
      parameters: [
        idParam,
        { name: "force", in: "query", schema: { type: "string", enum: ["true", "false", "1", "0", "yes", "no", "on", "off"] } },
      ],
      responses: {
        200: successResponse(),
        400: { $ref: "#/components/responses/BadRequest" },
        404: { $ref: "#/components/responses/NotFound" },
        409: { $ref: "#/components/responses/Conflict" },
        ...adminResponses,
      },
    },
  },
});

//* 🟢 Swagger UI Options
const swaggerUiOptions = {
  explorer: true,
  customSiteTitle: "E-Commerce API Docs",
  swaggerOptions: {
    persistAuthorization: true,
  },
};

//? 🔵 Export Swagger Config
module.exports = {
  swaggerUi,
  swaggerSpec,
  swaggerUiOptions,
};
