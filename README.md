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
