# mongodb-extension

A lightweight, high-performance MongoDB framework for Node.js and TypeScript.

`mongodb-extension` provides a repository abstraction, metadata-driven object mapping, search framework, optimistic locking, batch operations, streaming utilities, and health checks on top of the official MongoDB driver.

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
npm install mongodb-extension
```

or

```bash
yarn add mongodb-extension
```

---

# Why mongodb-extension?

Most MongoDB projects eventually implement the same infrastructure repeatedly:

- Repository classes
- CRUD helpers
- Search APIs
- Pagination
- Sorting
- Mapping between Mongo documents and models
- Batch processing
- Optimistic locking
- Health checks

This library provides those components out of the box so developers can focus on business logic.

---

# Architecture

```
 Application
      │
      ▼
 Repository
      │
      ▼
CRUDRepository
      │
      ▼
 MongoLoader
      │
      ▼
  mongo.ts
      │
      ▼
MongoDB Driver
```

The framework separates responsibilities into multiple reusable layers.

---

# Core Components

## mongo.ts

Low-level MongoDB operations.

Provides helper functions for:

- Find
- Insert
- Update
- Patch
- Delete
- Bulk operations
- Projection
- Mapping
- Query execution

If you prefer working directly with MongoDB collections, this layer is sufficient.

---

## MongoLoader

Read-only repository.

Provides methods like:

- load()
- exist()
- all()
- metadata()

Ideal for query-only services.

---

## CRUDRepository

Extends MongoLoader and adds:

- insert
- update
- patch
- save
- delete

Suitable for standard CRUD applications.

---

## Repository

Full repository implementation.

Includes

- CRUD
- Search
- Pagination
- Sorting
- Filtering

Most applications only need this class.

---

## SearchRepository

Search-only repository.

Useful for

- reporting APIs
- public APIs
- read models
- CQRS query side

without exposing write operations.

---

# Metadata Mapping

The framework maps TypeScript models to MongoDB documents using metadata.

Supports:

- Collection name
- Id field
- ObjectId conversion
- Version field
- Ignored fields
- Custom mappings

No decorators are required.

---

# CRUD Operations

```ts
const repository = new UserRepository(db)

await repository.insert(user)

await repository.update(user)

await repository.patch(id, changes)

await repository.delete(id)

const user = await repository.load(id)
```

---

# Search

SearchRepository supports

- keyword search
- filtering
- sorting
- pagination

Example

```ts
const result = await repository.search(searchModel)
```

Typical REST endpoint

```
GET /users

?page=1
&size=20
&sort=-createdAt,name
&q=john
```

---

# Dynamic Query Builder

The framework converts search models into MongoDB queries automatically.

Supports

- strings
- numbers
- booleans
- dates
- arrays
- nested filters

Applications only need to provide the search model.

---

# Pagination

Built-in support for

- page
- size
- total
- items

No additional code required.

---

# Sorting

Supports multiple fields.

Example

```
sort=-createdAt,name
```

which becomes

```
createdAt DESC
name ASC
```

---

# Optimistic Locking

Supports version-based updates.

Typical workflow

```
  Read document

        ↓

     Modify

        ↓

Update with version

        ↓

 Version mismatch

        ↓

Conflict detected
```

Ideal for preventing lost updates.

---

# Batch Operations

For high-volume processing.

Includes

- MongoBatchInserter
- MongoBatchUpdater
- MongoBatchWriter

Useful for

- ETL
- Import
- Synchronization
- Scheduled jobs

---

# Single Operations

Helper classes

- MongoInserter
- MongoUpdater
- MongoPatcher
- MongoUpserter

These classes simplify service implementations and encourage reusable business logic.

---

# FieldLoader

Efficiently loads specific fields without retrieving the entire document.

Example

```ts
const email = await loader.valueOf(id, "email")
```

Useful for

- validation
- foreign key lookup
- existence checks

---

# Audit Logging

AuditLogWriter provides a simple mechanism for storing

- user
- action
- resource
- IP
- status
- remarks

Suitable for enterprise auditing requirements.

---

# Health Check

MongoChecker implements the HealthChecker interface.

Designed for Kubernetes.

Features

- configurable timeout
- response time
- status
- error reporting

Example

```ts
const checker = new MongoChecker(db)

const result = await checker.check()
```

---

# Performance

The framework is designed with minimal runtime overhead.

Features include

- no decorators
- no reflection
- lightweight mapping
- direct MongoDB driver usage
- efficient batch processing

Most operations are very close to the performance of the native MongoDB driver.

---

# Typical Project Structure

```
src
 ├── model
 ├── repository
 ├── service
 ├── controller
 └── index.ts
```

Repository

```
Controller
    │
    ▼
 Service
    │
    ▼
Repository
    │
    ▼
 MongoDB
```

---

# Example

```ts
class UserRepository extends Repository<User, string> {

    constructor(db: Db) {
        super(db, metadata)
    }

}
```

Service

```ts
const user = await repository.load(id)

await repository.update(user)
```

---

# Best Use Cases

- Enterprise REST APIs
- Internal services
- Microservices
- CQRS
- ETL
- Import/Export
- Batch processing
- Admin applications
- Back-office systems

---

# Philosophy

The framework follows a few simple principles.

- Keep MongoDB simple.
- Hide repetitive infrastructure.
- Keep business logic clean.
- Stay close to the native MongoDB driver.
- Avoid unnecessary abstraction.
- Prefer composition over configuration.
- TypeScript first.

---

# Ecosystem

This library works well together with:

- sql-core
- mysql2-core
- query-mappers
- io-one
- validation-core
- reflect-core
- config-plus

Together they provide a lightweight platform for building modern Node.js applications.

---

# Roadmap

Future improvements may include

- Aggregation pipeline helpers
- Transaction helpers
- Change Stream utilities
- Multi-document transactions
- Soft delete support
- Repository caching
- Metrics integration

---

# Contributing

Contributions are welcome.

Please submit issues, feature requests, or pull requests.

---

# License

MIT