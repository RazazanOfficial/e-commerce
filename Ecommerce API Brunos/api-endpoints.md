# Ecommerce API Endpoints

Base URL variable in Bruno: `baseURL=http://localhost:9999`

All backend routes are mounted under `/api`, so call them as `{{baseURL}}/api/...`.

Admin routes require login cookie `token` and role `admin` or `developer`.

## Auth

| Method | Path | Body / Query |
|---|---|---|
| POST | `/api/register` | `name`, `phone`, `email`, `password`, `confirmPassword` |
| POST | `/api/login` | `phoneOrEmail`, `password`; sets `token` cookie |
| GET | `/api/user-details` | auth cookie required |
| GET | `/api/logout` | clears `token` cookie |

## Storefront

| Method | Path | Query |
|---|---|---|
| GET | `/api/products` | `page`, `limit`, `sort=newest|oldest|price_asc|price_desc`, `categoryId`, `categorySlug`, `q` |
| GET | `/api/products/:slug` | - |

## Admin Users

| Method | Path | Body / Query |
|---|---|---|
| GET | `/api/admin/all-users` | `page`, `limit` |
| GET | `/api/admin/search-users` | `q`, `page`, `limit` |
| GET | `/api/admin/user/:id` | - |
| PUT | `/api/admin/user/:id` | `name`, `phone`, `email`, `password`, `role=user|admin|developer`, `address`, `postalCode` |
| DELETE | `/api/admin/user/:id` | cannot delete self |

## Admin Categories

| Method | Path | Body / Query |
|---|---|---|
| GET | `/api/admin/categories` | - |
| POST | `/api/admin/categories` | `name`, `slug`, `description`, `image`, `imageAlt`, `isActive`, `metaTitle`, `metaDescription`, `keywords`, `parent` |
| PUT | `/api/admin/categories/:id` | same as create + `sortOrder`; partial update allowed |
| DELETE | `/api/admin/categories/:id` | blocks delete if category has children or products |

## Admin Products

| Method | Path | Body / Query |
|---|---|---|
| GET | `/api/admin/products` | `page`, `limit`, `status=DRAFT|ACTIVE|ARCHIVED`, `categoryId`, `visible=true|false`, `search` or `q` |
| GET | `/api/admin/products/search` | required `q`; optional `page`, `limit`, `status`, `visible` |
| GET | `/api/admin/products/:id` | - |
| POST | `/api/admin/products` | product payload; ACTIVE requires `title`, `slug`, `shortDescription`, `categoryId`, `price`, `currency`, and at least one primary media/image |
| PUT | `/api/admin/products/:id` | partial product payload |
| DELETE | `/api/admin/products/:id` | soft archive: status becomes `ARCHIVED` |
| PATCH | `/api/admin/products/:id/restore` | restores archived product to `DRAFT` |
| DELETE | `/api/admin/products/:id/hard` | permanent delete |

### Product payload fields

`title`, `slug`, `shortDescription`, `overviewHtml`, `categoryId`, `brandId`, `tags`, `status`, `visible`, `price`, `currency`, `compareAt`, `cost`, `inventory`, `stockStatus`, `lowStockThreshold`, `publishAt`, `allowBackorder`, `restockNotifyEnabled`, `hasVariants`, `options`, `variants`, `media`, `images`, `videos`, `attributes`, `techSpecs`, `faqs`, `seo`, `shipping`, `warranty`, `returnPolicy`, `handlingTime`, `related`, `breadcrumbsCache`.

## Option Catalogs

| Method | Path | Body / Query |
|---|---|---|
| GET | `/api/admin/option-catalogs` | `q`, `isActive`, `page`, `limit`, `sort=name|code|isActive|createdAt|updatedAt`, `dir=asc|desc` |
| GET | `/api/admin/option-catalogs/:id` | - |
| POST | `/api/admin/option-catalogs` | `name`, `code`, `values`, `isActive` |
| PUT | `/api/admin/option-catalogs/:id` | `name`, `code`, `values`, `isActive`; partial update allowed |
| PATCH | `/api/admin/option-catalogs/:id/toggle` | toggles `isActive` |
| DELETE | `/api/admin/option-catalogs/:id` | blocks delete if used by products |

## Tag Catalogs

| Method | Path | Body / Query |
|---|---|---|
| GET | `/api/admin/tag-catalogs` | `q`, `isActive`, `page`, `limit` |
| GET | `/api/admin/tag-catalogs/suggest` | required-ish `q`; empty returns `[]` |
| GET | `/api/admin/tag-catalogs/:id` | - |
| POST | `/api/admin/tag-catalogs` | `label` or `name` or `title`, optional `key`, `isActive` |
| PUT | `/api/admin/tag-catalogs/:id` | `label` or `name` or `title`, `key`, `isActive`; partial update allowed |
| PATCH | `/api/admin/tag-catalogs/:id/toggle` | optional body `isActive`; without body toggles current value |
| DELETE | `/api/admin/tag-catalogs/:id` | blocks delete if used by products |

## Currency Catalogs

| Method | Path | Body / Query |
|---|---|---|
| GET | `/api/admin/currency-catalogs` | `q`, `isActive` |
| GET | `/api/admin/currency-catalogs/:id` | - |
| POST | `/api/admin/currency-catalogs` | `nameFa`, `code`, `symbol`, `isActive`, `sortOrder` |
| PUT | `/api/admin/currency-catalogs/:id` | same as create; partial update allowed |
| PATCH | `/api/admin/currency-catalogs/:id/toggle` | toggles `isActive` |
| DELETE | `/api/admin/currency-catalogs/:id` | blocks delete if used by products |

## Media

| Method | Path | Body / Query |
|---|---|---|
| GET | `/api/admin/media` | `page`, `limit`, `q`, `kind=image|video|gif|other` |
| GET | `/api/admin/media/bucket` | `prefix`, `limit`, `continuationToken`, `kind` |
| POST | `/api/admin/media/presign` | `mimeType=image/jpeg|image/jpg|image/png|image/webp|image/gif|video/mp4|video/webm|video/quicktime`, optional `expiresInSec` |
| POST | `/api/admin/media/commit` | `key`, `originalName`, `kind` |
| DELETE | `/api/admin/media` | query/body `key`, optional `force=true` |
| DELETE | `/api/admin/media/:id` | optional query `force=true` |
