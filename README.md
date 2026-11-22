# mongodb-kit

A TypeScript utility library for working with MongoDB through the official MongoDB Node.js driver. It provides reusable connection helpers, document mapping, data access classes, CRUD and batch operations, metadata-driven search, audit logging, and a MongoDB health checker.

The library is designed to reduce repetitive persistence code while allowing applications to supply their own domain types, query builders, and BSON conversion functions.

> **Package:** `mongodb-kit`  
> **Repository:** [core-ts/mongo](https://github.com/core-ts/mongo)  
> **MongoDB driver dependency:** `mongodb` (`^7.0.0` in the supplied `package.json`)

## Contents

- [Capabilities](#capabilities)
- [Installation](#installation)
- [Connecting to MongoDB](#connecting-to-mongodb)
- [Metadata and field mapping](#metadata-and-field-mapping)
- [Loading and CRUD repositories](#loading-and-crud-repositories)
- [Searching and pagination](#searching-and-pagination)
- [Model-based service](#model-based-service)
- [Other utilities](#other-utilities)
- [Public API overview](#public-api-overview)
- [Implementation notes and caveats](#implementation-notes-and-caveats)
- [Development](#development)

## Capabilities

| Area | What the library provides |
|---|---|
| Connection | `connect` and `connectToDb` helpers |
| Loading | Find one document, load by ID, list all documents, and check existence |
| CRUD | Insert, full-document replacement, partial update, upsert-style save, and delete by ID |
| Batch writes | Batch insert, update, and write/upsert operations using MongoDB bulk writes |
| Search | Metadata-driven filters, sorting, field projection, pagination, and total counts |
| Mapping | Map an application ID property to MongoDB `_id`, and map application property names to stored field names |
| BSON conversion | Optional `toBson` and `fromBson` functions around repository operations |
| Versioning | Optional version-field handling for update, patch, and save operations |
| Geospatial data | Convert latitude/longitude properties to and from a GeoJSON-like point object |
| Supporting utilities | Field value loading, audit log writing, and MongoDB health checks |
| Aggregation | Execute a supplied MongoDB aggregation pipeline |

The package is a data-access utility layer. It does not define application-specific domain models, HTTP routes, authentication, or transaction boundaries.

## Installation

```bash
npm install mongodb-kit mongodb
```

The package depends on the official `mongodb` Node.js driver. Applications should use a driver version compatible with the version expected by the installed `mongodb-kit` release.

## Connecting to MongoDB

### Obtain a `Db` instance

```ts
import { connectToDb } from "mongodb-kit"

const db = await connectToDb(
  process.env.MONGODB_URI as string,
  "sample-app",
)
```

`connectToDb(uri, db, authSource?, maxPoolSize?)` returns a MongoDB `Db` instance. Its defaults are `authSource = "admin"` and `maxPoolSize = 5`.

### Retain the client when you need to close it

```ts
import { connect } from "mongodb-kit"

const client = await connect(process.env.MONGODB_URI as string, {
  authSource: "admin",
  maxPoolSize: 10,
})

const db = client.db("sample-app")

try {
  // Create repositories and use the database here.
} finally {
  await client.close()
}
```

`connect(uri, options)` returns the `MongoClient`. The implementation logs a success or failure message to the console and rethrows connection errors.

The package also exports a `MongoConfig` interface with `uri`, `db`, optional `auth_source`, and optional `pool_size` fields. The connection helpers accept positional arguments or driver options; they do not automatically consume a `MongoConfig` object.

## Metadata and field mapping

Several repository classes accept either an ID property name (`string`) or an `Attributes` metadata object. Metadata describes how application properties correspond to MongoDB document fields.

```ts
import { Attributes } from "mongodb-kit"

const userAttributes: Attributes = {
  id: {
    key: true,
    type: "string",
  },
  username: {
    field: "user_name",
    type: "string",
    q: true,
    operator: "like",
  },
  email: {
    type: "string",
    q: true,
  },
  createdAt: {
    field: "created_at",
    type: "datetime",
    operator: ">=",
  },
  version: {
    type: "integer",
    version: true,
  },
}
```

### Attribute properties

| Property | Meaning in the implementation |
|---|---|
| `name` | Populated by `buildMap` with the attribute key |
| `field` | Stored MongoDB field name when it differs from the application property |
| `type` | Field type, including `ObjectId`, `date`, `datetime`, `number`, `string`, and collection types |
| `operator` | Search comparison mode; see [Query behavior](#query-behavior) |
| `key` | Marks the application property corresponding to MongoDB `_id` |
| `q` | Includes a string field in the metadata-driven free-text search |
| `version` | Marks the property used by repository version handling |

The `DataType` union also includes `time`, `boolean`, `integer`, `text`, `object`, `array`, `binary`, and plural forms such as `strings`, `dates`, and `numbers`.

### ID behavior

- With an `Attributes` object, `build` selects the first attribute marked `key: true` as the ID property.
- If the selected key has `type: "ObjectId"`, `MongoLoader.load` and `MongoLoader.exist` convert the supplied ID to a BSON `ObjectId`.
- If no attribute is marked as the key, the metadata builder defaults the logical ID property name to `id`.
- With a string instead of metadata, that string is used as the logical ID property name.
- Repository reads and writes map the logical ID property to MongoDB `_id` and back.

### Stored field names

For an attribute such as `username: { field: "user_name" }`, the library uses `user_name` as the stored field name and maps returned documents back to `username`. The metadata builder also constructs an internal reverse map for this purpose.

### Collection name resolution

`getCollectionName(model, explicitName?)` resolves the collection name in this order:

1. Explicit `collectionName` argument.
2. `model.collection`.
3. `model.source`.
4. `model.name`.
5. Empty string if none is provided.

`Model` also declares `table`, but `getCollectionName` does not use it.

## Loading and CRUD repositories

### `MongoLoader<T, ID>`

`MongoLoader` provides read-only access to one collection:

```ts
import { MongoLoader } from "mongodb-kit"

interface User {
  id: string
  username: string
}

const users = new MongoLoader<User, string>(db, "users", userAttributes)

const user = await users.load("user-123")
const allUsers = await users.all()
const exists = await users.exist("user-123")
```

Methods:

| Method | Behavior |
|---|---|
| `load(id)` | Finds one document by `_id`; returns the document or `null` when no document is found at runtime |
| `all()` | Loads all documents in the collection and applies configured ID/field mapping and `fromBson` conversion |
| `exist(id)` | Counts matching documents and returns whether the count is greater than zero |
| `metadata()` | Returns the supplied `Attributes`, when metadata was supplied |

The module also exports `useGet` and its alias `useLoad`. Each creates a `MongoLoader` and returns its bound `load` function.

### `CRUDRepository<T, ID>`

`CRUDRepository` extends `MongoLoader` with write methods:

```ts
import { CRUDRepository } from "mongodb-kit"

const users = new CRUDRepository<User, string>(db, "users", userAttributes)

await users.create({ id: "user-123", username: "Ada" })
await users.update({ id: "user-123", username: "Ada Lovelace" })
await users.patch({ id: "user-123", username: "Ada" })
await users.save({ id: "user-123", username: "Ada" })
await users.delete("user-123")
```

| Method | Behavior |
|---|---|
| `create(obj)` | Inserts a document. When version metadata is configured, initializes that property to `1`. |
| `update(obj)` | Replaces the matched document. This is a full-document replacement, not a partial update. |
| `patch(obj)` | Applies the supplied properties with MongoDB `$set`. |
| `save(obj)` | Uses the library's upsert-style save flow; see the caveat about existing `_id` values below. |
| `delete(id)` | Deletes one document by the supplied `_id` value. |

The repository accepts optional `toBson` and `fromBson` conversion functions. These are used by the individual single-document read/write helpers where supported.

`create`, `update`, `patch`, `save`, and `delete` return numeric results rather than the saved document. The exact meaning depends on the operation: for example, insert methods return an acknowledged/count-style result, update helpers return an affected-row-style result, and version conflicts are represented as `-1` by the version-aware repository methods.

### Version metadata

An attribute marked `version: true` enables version handling in `CRUDRepository`:

- `create` initializes the selected version property to `1`.
- `update` and `patch` increment the version and include a version condition in the write filter when the supplied version is a number.
- `save` initializes the version for a new object or increments it for an existing object.
- A write that matches no document through the version-aware path is returned as `-1`.

See [Implementation notes and caveats](#implementation-notes-and-caveats) before relying on custom version property names.

## Searching and pagination

The package provides two generic search classes and a model-based service.

### `Repository<T, ID, S>`

`Repository` extends `CRUDRepository` and adds metadata-aware search. It accepts an optional custom query builder, BSON conversion functions, sort property name, query property name, exclusion property name, and custom sort builder.

```ts
import { Repository } from "mongodb-kit"

interface UserSearch {
  username?: string
  q?: string
  excluding?: string | string[]
  sort?: string
}

const users = new Repository<User, string, UserSearch>(
  db,
  "users",
  userAttributes,
)

const result = await users.search(
  { username: "Ada", sort: "-createdAt" },
  20,
  1,
)

console.log(result.list)
console.log(result.total)
```

The default search property names are:

- `sort`: comma-separated sort expressions.
- `q`: free-text search across metadata attributes marked `q: true`.
- `excluding`: IDs to exclude; a comma-separated string is split into an array.

These names can be overridden through the constructor. `Repository.search(filter, limit, page?, fields?)` treats the third argument as a **page number**, starting at `1`, and converts it to a skip offset.

### `SearchRepository<T, S>`

`SearchRepository` provides search without inheriting the CRUD write methods. It accepts the same style of query builder, metadata, sort configuration, and field conversion options. Its `search` method also uses a page number for its optional third argument.

`SearchBuilder` is exported as an alias of `SearchRepository`.

### `MongoLowCodeService<T, ID, S>`

`MongoLowCodeService` combines CRUD repository behavior with metadata-driven searching from a `Model` object:

```ts
import { Model, MongoLowCodeService } from "mongodb-kit"

const userModel: Model = {
  name: "users",
  collection: "users",
  sort: "sort",
  attributes: userAttributes,
}

const users = new MongoLowCodeService<User, string, UserSearch>(db, userModel)

const result = await users.search(
  { username: "Ada", sort: "-createdAt" } as UserSearch,
  20,
  0,
)
```

`MongoLowCodeService.search(filter, limit?, skip?, fields?)` treats the third argument as a **skip offset**, not a page number. It defaults the sort property to `model.sort` or `"sort"`. It can accept custom query and sort builders. If explicit `toBson`/`fromBson` functions are not supplied and the model defines `geo`, `latitude`, and `longitude`, the service installs a `PointMapper` automatically.

The package exports `MongoLowCodeRepository` as an alias of `MongoLowCodeService`.

### Query behavior

The default `buildQuery` function is metadata-driven. It handles values according to the attribute metadata and constructs MongoDB filters.

| Input / metadata | Behavior implemented |
|---|---|
| String with `operator: "="` | Exact string match |
| String with `operator: "like"` | Regular expression using `\\w*value\\w*` |
| Other string operator values | Prefix regular expression using `^value` |
| Date or number | Comparison selected from `>=`, `>`, `<`; other values fall through to `<=` |
| Array | `$in` when the array is non-empty |
| Date/datetime range object | Builds `$gte` / `$gt` and `$lte` / `$lt` bounds from recognized keys |
| Number/integer range object | Builds numeric lower and upper bounds from recognized keys |
| `q` parameter | Searches string attributes marked `q: true` using `$or` when multiple fields qualify |
| `excluding` parameter | Adds `_id: { $nin: [...] }` |

For string comparisons, `buildMatch` and `buildQ` interpolate the supplied value into a regular expression without escaping regular-expression metacharacters. Review this behavior before using untrusted input as a search value.

### Sorting

`buildSort` accepts comma-separated fields:

- `name` sorts ascending.
- `+name` sorts ascending.
- `-name` sorts descending.

When metadata is supplied, sort field names can be translated through each attribute's `field` property.

### Search result shape

Search methods return:

```ts
interface SearchResult<T> {
  list: T[]
  total?: number
}
```

When a truthy `limit` is supplied, the implementation runs a count query alongside the list query and includes `total`. Without a truthy `limit`, it returns the list without `total`. A `fields` array can be used to build a MongoDB projection. The projection builder receives those field names directly; it does not translate application property names through the metadata field map, so use stored MongoDB field names when projecting renamed fields.

## Other utilities

### Single-document writer classes

`one.ts` exports small writer wrappers around a `Collection`:

| Class | Operation |
|---|---|
| `MongoInserter<T>` | `insert` |
| `MongoUpdater<T>` | Full replacement via `update` |
| `MongoPatcher<T>` | Partial `$set` via `patch` |
| `MongoUpserter<T>` | Upsert-style `upsert` helper |

Each exposes `write(obj): Promise<number>` and accepts an optional ID property name and transformation function.

### Batch writer classes

`batch.ts` exports:

| Class | Operation |
|---|---|
| `MongoBatchInserter<T>` | `insertMany` |
| `MongoBatchUpdater<T>` | Bulk update of documents that contain `_id` |
| `MongoBatchWriter<T>` | Bulk update/upsert for documents with `_id`, insert for documents without `_id` |

Each exposes `write(list): Promise<number>`. An optional mapping function is applied to each item before the batch operation. These classes use MongoDB bulk operations; they do not provide per-item result objects.

### `FieldLoader`

`FieldLoader` loads values from one configured field for documents whose value in that same field is included in the supplied list:

```ts
import { FieldLoader } from "mongodb-kit"

const usernames = new FieldLoader(db, "users", "username")
const values = await usernames.values(["Ada", "Grace"])
```

The underlying `valueOf` helper queries the configured field with `$in`, projects that field, and sorts it ascending unless `noSort` is set when calling `valueOf` directly. It does not use a separate document-ID field, and it does not apply MongoDB `distinct`; repeated field values can therefore appear when multiple documents match.

### `AuditLogWriter`

`AuditLogWriter` writes one audit document to a configured collection:

```ts
import { AuditLogWriter } from "mongodb-kit"

const audit = new AuditLogWriter(db, "audit_logs", () => crypto.randomUUID())

await audit.write(
  "user-123",
  "127.0.0.1",
  "users",
  "update",
  true,
  "Updated profile",
)
```

The default field names are `user`, `ip`, `resource`, `action`, `timestamp`, `status`, and `remark`. A custom `AuditLogConfig` can override these names. The writer returns `1` when MongoDB acknowledges the insert and `0` otherwise.

### `MongoChecker`

`MongoChecker` implements the exported `HealthChecker` interface. It runs `db.admin().ping()` and returns an object containing `responseTime` and `status` (`"UP"` or `"DOWN"`). On failure it also includes an `error` message. The default service name is `"mongodb"` and the default timeout is `4500` milliseconds.

```ts
import { MongoChecker } from "mongodb-kit"

const checker = new MongoChecker(db, "mongodb", 4500)
const health = await checker.check()
```

### Geospatial point mapping

`PointMapper<T>`, `toPoint`, `fromPoint`, `toPoints`, and `fromPoints` convert between separate latitude/longitude properties and a point object.

By default, the property names are `geo`, `latitude`, and `longitude`; alternative names can be supplied. The current implementation writes a point with `type: "Point"` and `coordinates: [latitude, longitude]`, then removes the separate latitude and longitude properties. The reverse conversion reads the first two coordinates back into those properties.

### Aggregation and low-level helpers

The `mongo.ts` module exports lower-level functions for finding, counting, inserting, updating, patching, upserting, deleting, mapping fields, building projections, and running aggregation pipelines. `findWithAggregate(collection, pipeline)` passes the supplied pipeline to `collection.aggregate()` and returns its results as an array.

These functions are exported from the package root, so applications can use them without creating a repository class.

## Public API overview

The package root (`src/index.ts`, compiled to `lib/index.js`) re-exports the following modules:

| Module | Main exports |
|---|---|
| `mongo.ts` | `MongoConfig`, `connect`, `connectToDb`, find/write/delete/count/aggregate helpers, mapping and point functions |
| `metadata.ts` | `Model`, `Attribute`, `Attributes`, `DataType`, `Operator`, `build`, `buildMap`, `getVersion`, `getCollectionName` |
| `MongoLoader.ts` | `MongoLoader`, `useGet`, `useLoad`, `Load`, `Get` |
| `MongoWriter.ts` | `CRUDRepository` |
| `repository.ts` | `Repository` |
| `search-repository.ts` | `SearchRepository`, `SearchBuilder`, `Query`, `getOffset` |
| `MongoLowCodeService.ts` | `MongoLowCodeService`, `MongoLowCodeRepository` |
| `search.ts` | `SearchResult`, `buildSearchResult`, `buildSort`, `getField` |
| `query.ts` | `buildQuery`, `buildMatch`, `buildQ`, range helpers |
| `one.ts` | Single-document writer classes |
| `batch.ts` | Batch writer classes |
| `FieldLoader.ts` | `FieldLoader` |
| `AuditLogWriter.ts` | `AuditLogWriter`, `AuditLogConfig`, `initializeAuditLogConfig` |
| `MongoChecker.ts` | `MongoChecker`, `HealthChecker`, `AnyMap` |

The root entry point also exports compatibility aliases:

| Exported alias | Underlying class |
|---|---|
| `GenericRepository` | `CRUDRepository` |
| `MongoGenericRepository` | `CRUDRepository` |
| `MongoRepository` | `Repository` |
| `MongoSearchRepository` | `SearchRepository` |
| `LoadRepository` | `MongoLoader` |
| `MongoLoadRepository` | `MongoLoader` |
| `MongoViewRepository` | `MongoLoader` |
| `ViewRepository` | `MongoLoader` |
| `MongoLowCodeRepository` | `MongoLowCodeService` |

## Implementation notes and caveats

The following points are based on the supplied source code. They are important when designing application code around the current implementation.

1. **`update` is replacement; `patch` is partial.** `update` uses `findOneAndReplace`, while `patch` uses `$set`. Calling `update` with only a subset of fields can replace the stored document with an incomplete document.
2. **The `upsert` helper has two different paths.** When an object already has `_id`, `upsert` calls `findOneAndUpdate` without `upsert: true`; it does not insert a missing document on that path. When the object has no `_id`, it inserts. `upsertWithFilter` and the bulk writer have explicit upsert behavior.
3. **Version filtering uses a literal `version` field.** `getVersion` can discover any property marked `version: true`, but version-aware update/patch/save filters use the database field name `version`. A custom version property name should not be assumed to work without checking or adjusting this implementation.
4. **`delete(id)` does not apply the loader's ObjectId conversion.** `load` and `exist` convert IDs when the metadata key type is `ObjectId`; `CRUDRepository.delete` passes the supplied ID directly to `deleteById`.
5. **Search helpers mutate input objects.** `buildQuery` deletes the configured `q` and `excluding` properties from the supplied search object. `MongoLowCodeService.search` also deletes its configured sort property before building the query. Pass a fresh filter object or clone it when the original must be retained.
6. **Range query construction shares a mutable condition object.** In `buildQuery`, the same range object is reused while processing date and numeric fields. Multiple range fields in one filter may therefore interact unexpectedly and should be tested carefully.
7. **Regular-expression search values are not escaped.** String values used by the default prefix/`like` matching logic are interpolated into `RegExp` patterns. Validate or escape untrusted values at the application boundary.
8. **Point coordinate order is `[latitude, longitude]`.** This is the order written by the supplied `toPoint` implementation. Verify compatibility with any MongoDB geospatial index or query conventions used by the application.
9. **Audit log timestamp is configured but not written.** `AuditLogConfig` includes a `timestamp` field name, but `AuditLogWriter.write` does not assign a timestamp property. Also, the interface types `status` as `string`, while `write` stores the supplied `success` boolean.
10. **Driver result assumptions should be verified.** `getAffectedRow` reads `lastErrorObject.n` or `ok` from find-and-update/replace results. Confirm that this matches the result shape returned by the MongoDB Node.js driver version used at runtime.
11. **Batch operations have different result semantics.** Batch update returns `modifiedCount`, which can be zero when documents matched but no stored values changed. Batch insert and batch upsert return their own inserted/modified/upserted counts.
12. **No automated tests are included in the supplied archive.** The package metadata also defines no test or lint script. Validate behavior against a real MongoDB instance or a suitable test database before relying on edge cases.
13. **Package metadata needs a release check.** `package.json` identifies version `0.0.3`, while the root package entry in the supplied `package-lock.json` identifies `0.0.2`. The `types` entry points to `src/index.ts`, and `tsconfig.json` has `declaration: false`; confirm that the published package includes the TypeScript source referenced by `types`.

## Development

The supplied package scripts are:

```bash
npm run build:lib
npm run clean:lib
```

- `build:lib` runs `tsc` and emits CommonJS JavaScript into `lib/`.
- `clean:lib` removes the generated `lib/` directory.

The supplied `tsconfig.json` enables strict type checking, targets ES5, uses CommonJS modules, and includes `src/**/*.ts`. Declaration-file generation is disabled.

There is no `test` script in the supplied `package.json`.

## Source layout

```text
mongodb-kit/
├── src/
│   ├── index.ts                 # Package exports and compatibility aliases
│   ├── mongo.ts                 # MongoDB connection and low-level operations
│   ├── metadata.ts              # Model/attribute metadata and mapping
│   ├── MongoLoader.ts           # Read operations
│   ├── MongoWriter.ts           # CRUDRepository
│   ├── repository.ts            # CRUD repository with search
│   ├── search-repository.ts     # Read/search repositories and Query
│   ├── MongoLowCodeService.ts   # Metadata-driven CRUD/search service
│   ├── query.ts                 # Filter construction
│   ├── search.ts                # Sorting, projection, and search results
│   ├── one.ts                   # Single-document writers
│   ├── batch.ts                 # Batch writers
│   ├── FieldLoader.ts           # Values for a selected field
│   ├── AuditLogWriter.ts        # Audit log persistence
│   └── MongoChecker.ts          # MongoDB ping health check
├── lib/                         # Compiled JavaScript entry point
├── package.json
├── package-lock.json
└── tsconfig.json
```

---

This README describes the implementation in the supplied `mongodb-kit` source archive. It does not imply that every behavior has been integration-tested against every MongoDB server or driver version.

## License

MIT

# mongodb-kit

A lightweight, high-performance MongoDB framework for Node.js and TypeScript.

`mongodb-kit` provides a repository abstraction, metadata-driven object mapping, search framework, optimistic locking, batch operations, streaming utilities, and health checks on top of the official MongoDB driver.

It is designed for enterprise applications while remaining simple enough to use directly in small services.

### Examples:
- [mongo-modular-sample](https://github.com/source-code-template/mongo-modular-sample): RESI API with express and mongodb
- [mongo-simple-modular-sample](https://github.com/source-code-template/mongo-simple-modular-sample): RESI API with express and mongodb

---

## Features

- Lightweight wrapper around the MongoDB driver
- Repository pattern
- Metadata-driven document mapping
- Generic CRUD repository
- Search repository with pagination and sorting
- Dynamic query builder
- Optimistic locking
- Batch insert/update utilities
- Bulk operations
- Field projection
- Import/Export helpers
- Health checker for Kubernetes
- TypeScript-first
- No decorators required
- Minimal runtime overhead

---

# Installation

```bash
npm install mongodb-kit
```

or

```bash
yarn add mongodb-kit
```

---

## Quick Start

### Define a model

```typescript
export interface User {
    id: string;
    name: string;
    email: string;
    age: number;
}
```

---

### Create a repository

```typescript
import { MongoClient } from "mongodb";
import { Repository } from "mongo-repository";

const client = await MongoClient.connect(connectionString);

const database = client.db("sample");

const repository = new Repository<User>(
    database,
    "users"
);
```

---

### Create

```typescript
await repository.create({
    id: "u01",
    name: "John",
    email: "john@example.com",
    age: 30
});
```

---

### Find by id

```typescript
const user = await repository.load("u01");
```

---

### Update

```typescript
await repository.update({
    id: "u01",
    name: "John Smith",
    email: "john@example.com",
    age: 31
});
```

---

### Delete

```typescript
await repository.delete("u01");
```

---

## Searching

Define a search model.

```typescript
export interface UserFilter {
    name?: string;
    age?: number;
    page?: number;
    size?: number;
}
```

Search

```typescript
const result = await repository.search({
    name: "John",
    page: 1,
    size: 20
});
```

---

## Custom Query Builder

The repository allows replacing the default query generation.

```typescript
const repository = new Repository<User, string, UserFilter>(
    database,
    "users",
    undefined,
    buildUserQuery
);
```

Example

```typescript
function buildUserQuery(filter: UserFilter) {
    const query: any = {};

    if (filter.name) {
        query.name = {
            $regex: filter.name,
            $options: "i"
        };
    }

    if (filter.age) {
        query.age = filter.age;
    }

    return query;
}
```

---

## Pagination

The library supports server-side pagination.

```typescript
const users = await repository.search({
    page: 2,
    size: 50
});
```

---

## Sorting

Sort behavior can be customized.

```typescript
function buildSort(sort?: string) {
    if (!sort) {
        return { name: 1 };
    }

    if (sort === "-createdAt") {
        return { createdAt: -1 };
    }

    return { [sort]: 1 };
}
```

---

## Metadata Mapping

Application models do not have to match MongoDB documents.

MongoDB

```json
{
    "first_name": "John"
}
```

Application

```typescript
{
    firstName: "John"
}
```

Metadata automatically maps between them.

---

## BSON Conversion

The repository supports conversion between application objects and MongoDB BSON.

Example:

```typescript
new Repository(
    database,
    "users",
    metadata,
    buildQuery,
    toBson,
    fromBson
);
```

This is useful for:

- Value Objects
- UUID
- DateOnly
- Decimal
- Money
- Custom domain types

---

## Search Repository

For read-only services, use `SearchRepository`.

```typescript
const repository = new SearchRepository<User>(
    database,
    "users"
);
```

Supported operations include:

- search
- load
- exists
- count

---

## CRUD Repository

For full CRUD operations:

```typescript
const repository = new Repository<User>(
    database,
    "users"
);
```

Supported operations:

- insert
- update
- patch
- delete
- load
- search
- exists
- count

---

## Batch Operations

The library includes helpers for bulk operations.

Examples include:

- insert many
- update many
- delete many

These operations reduce round trips and improve performance.

---

## Audit Logging

Audit logging can be integrated through `AuditLogWriter`.

Typical audit information includes:

- user
- action
- timestamp
- entity
- old value
- new value

---

## Architecture

```
      Application
            │
            ▼
Repository / SearchRepository
            │
            ▼
MongoWriter / MongoLoader
            │
            ▼
      Mongo Helpers
            │
            ▼
      MongoDB Driver
```

---

## Why mongodb-kit?

Compared with using the MongoDB driver directly, this library provides:

- Generic repositories
- Reusable search logic
- Pagination
- Sorting
- Metadata mapping
- BSON conversion
- Reduced boilerplate
- Cleaner architecture

Compared with ODM frameworks:

- No decorators
- No runtime reflection
- No Active Record
- Better separation of concerns
- Closer to native MongoDB

---

## Suitable For

- Clean Architecture
- Domain Driven Design (DDD)
- Hexagonal Architecture
- Microservices
- Enterprise applications
- REST APIs
- GraphQL APIs
- Backend services

---

## Requirements

- Node.js 18+
- TypeScript 5+
- MongoDB 5+

---

## License

MIT

# Mongo Repository

A lightweight, generic MongoDB repository framework for **TypeScript**, built on top of the official MongoDB driver.

This library provides reusable repository implementations, search support, pagination, sorting, metadata mapping, BSON conversion, batch operations, and audit logging while keeping your application independent from MongoDB-specific code.

Unlike ODMs such as Mongoose, this library follows the **Repository Pattern**, making it suitable for Clean Architecture, DDD, Hexagonal Architecture, and microservices.

---

## Features

- Generic CRUD repositories
- Generic search repositories
- Built on the official MongoDB driver
- Strong TypeScript support
- Clean Repository Pattern
- Metadata-based field mapping
- Custom query builders
- Custom sort builders
- BSON converters
- Pagination
- Batch operations
- Audit logging support
- Lightweight with no decorators or reflection
- Easily extensible

---

## Installation

```bash
npm install mongodb
npm install mongo-repository
```

---

## Quick Start

### Define a model

```typescript
export interface User {
    id: string;
    name: string;
    email: string;
    age: number;
}
```

---

### Create a repository

```typescript
import { MongoClient } from "mongodb";
import { Repository } from "mongo-repository";

const client = await MongoClient.connect(connectionString);

const database = client.db("sample");

const repository = new Repository<User>(
    database,
    "users"
);
```

---

### Insert

```typescript
await repository.insert({
    id: "u01",
    name: "John",
    email: "john@example.com",
    age: 30
});
```

---

### Find by id

```typescript
const user = await repository.load("u01");
```

---

### Update

```typescript
await repository.update({
    id: "u01",
    name: "John Smith",
    email: "john@example.com",
    age: 31
});
```

---

### Delete

```typescript
await repository.delete("u01");
```

---

## Searching

Define a search model.

```typescript
export interface UserFilter {
    name?: string;
    age?: number;
    page?: number;
    size?: number;
}
```

Search

```typescript
const result = await repository.search({
    name: "John",
    page: 1,
    size: 20
});
```

---

## Custom Query Builder

The repository allows replacing the default query generation.

```typescript
const repository = new Repository<User, string, UserFilter>(
    database,
    "users",
    undefined,
    buildUserQuery
);
```

Example

```typescript
function buildUserQuery(filter: UserFilter) {
    const query: any = {};

    if (filter.name) {
        query.name = {
            $regex: filter.name,
            $options: "i"
        };
    }

    if (filter.age) {
        query.age = filter.age;
    }

    return query;
}
```

---

## Pagination

The library supports server-side pagination.

```typescript
const users = await repository.search({
    page: 2,
    size: 50
});
```

---

## Sorting

Sort behavior can be customized.

```typescript
function buildSort(sort?: string) {
    if (!sort) {
        return { name: 1 };
    }

    if (sort === "-createdAt") {
        return { createdAt: -1 };
    }

    return { [sort]: 1 };
}
```

---

## Metadata Mapping

Application models do not have to match MongoDB documents.

MongoDB

```json
{
    "first_name": "John"
}
```

Application

```typescript
{
    firstName: "John"
}
```

Metadata automatically maps between them.

---

## BSON Conversion

The repository supports conversion between application objects and MongoDB BSON.

Example:

```typescript
new Repository(
    database,
    "users",
    metadata,
    buildQuery,
    toBson,
    fromBson
);
```

This is useful for:

- Value Objects
- UUID
- DateOnly
- Decimal
- Money
- Custom domain types

---

## Search Repository

For read-only services, use `SearchRepository`.

```typescript
const repository = new SearchRepository<User>(
    database,
    "users"
);
```

Supported operations include:

- search
- load
- exists
- count

---

## CRUD Repository

For full CRUD operations:

```typescript
const repository = new Repository<User>(
    database,
    "users"
);
```

Supported operations:

- insert
- update
- patch
- delete
- load
- search
- exists
- count

---

## Batch Operations

The library includes helpers for bulk operations.

Examples include:

- insert many
- update many
- delete many

These operations reduce round trips and improve performance.

---

## Audit Logging

Audit logging can be integrated through `AuditLogWriter`.

Typical audit information includes:

- user
- action
- timestamp
- entity
- old value
- new value

---

## Architecture

```
Application
        │
        ▼
Repository / SearchRepository
        │
        ▼
MongoWriter / MongoLoader
        │
        ▼
Mongo Helpers
        │
        ▼
MongoDB Driver
```

---

## Why This Library?

Compared with using the MongoDB driver directly, this library provides:

- Generic repositories
- Reusable search logic
- Pagination
- Sorting
- Metadata mapping
- BSON conversion
- Reduced boilerplate
- Cleaner architecture

Compared with ODM frameworks:

- No decorators
- No runtime reflection
- No Active Record
- Better separation of concerns
- Closer to native MongoDB

---

## Suitable For

- Clean Architecture
- Domain Driven Design (DDD)
- Hexagonal Architecture
- Microservices
- Enterprise applications
- REST APIs
- GraphQL APIs
- Backend services

---

## Requirements

- Node.js 18+
- TypeScript 5+
- MongoDB 5+

---

## License

MIT