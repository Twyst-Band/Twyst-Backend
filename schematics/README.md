# NestJS Resource Generator Schematic

This custom schematic generates CRUD endpoints with Drizzle ORM integration, featuring runtime introspection, recursive relation handling, and custom pagination support.

## Installation

The schematic is already set up in this project. Dependencies are installed via npm.

## Usage

### Generate an Endpoint

Run the generator:

```bash
npm run generate:endpoint
```

Or use the NestJS CLI directly:

```bash
schematics ./schematics/collection.json:endpoint
```

### Interactive Prompts

The generator will ask you:

1. **Which table would you like to use?**
   - Lists all available tables from your schema

2. **What kind of endpoint do you want?**
   - Create (single record)
   - Read (single record)
   - Update (single record)
   - Delete (single record)
   - Create Many (multiple records)
   - Read Many (with pagination)
   - Update Many (multiple records)
   - Delete Many (multiple records)

3. **Include relations?** (for Create and Read operations)
   - Recursively asks which relations to include
   - Option to skip junction tables in many-to-many relationships

4. **Delete type?** (for Delete operations)
   - Normal delete (removes from database)
   - Replace delete (replaces with default values) - only if statusField is configured

5. **Pagination type?** (for Read Many)
   - Both (cursor and offset)
   - Cursor-based only
   - Offset-based only

6. **Public endpoint?**
   - Whether to skip authentication for this endpoint

## What Gets Generated

The schematic generates:

- **DTOs** (`dto/` folder)
  - Create DTOs with class-validator decorators
  - Update DTOs (all fields optional)
  - Read DTOs (for pagination with @Pagination decorator)

- **Service** (`[table].service.ts`)
  - Extends CommonService
  - Methods with Drizzle ORM queries
  - Transaction support for complex creates
  - Pagination integration for readMany

- **Controller** (`[table].controller.ts`)
  - HTTP method decorators (@Get, @Post, @Patch, @Delete)
  - Route handlers calling service methods
  - @PaginatedQuery decorator for paginated endpoints

- **Module** (`[table].module.ts`)
  - Registers controller and service
  - Imports PaginationModule if needed
  - Automatically added to app.module.ts

## Schema Requirements

Each table schema must export:

1. **Table definition** (e.g., `export const posts = pgTable(...)`)
2. **Relations** (e.g., `export const postRelations = relations(...)`)
3. **General select** (e.g., `export const postsGeneralSelect = { ... }`)
4. **Delete replace config** (e.g., `export const postsDeleteReplace = { ... }`)

Example:

```typescript
export const posts = pgTable('posts', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  title: text('title').notNull(),
  // ...
});

export const postRelations = relations(posts, ({ one, many }) => ({
  user: one(users, { fields: [posts.userID], references: [users.id] }),
  tagsToPosts: many(tagsToPosts)
}));

export const postsGeneralSelect = {
  id: true,
  title: true,
  content: true,
  userID: true,
  createdAt: true,
  updatedAt: true
};

export const postsDeleteReplace = {
  statusField: null, // or 'status' if you have a status field
  replaceValues: {
    title: '[Deleted Post]',
    content: '[This post has been deleted]'
  }
};
```

## Building the Schematic

Before using the schematic, build it:

```bash
npm run build:schematics
```

This compiles the TypeScript files in `schematics/` to JavaScript in `dist/schematics/`.

## Examples

### Generate a Create Endpoint for Posts

```bash
npm run generate:endpoint
# Select: posts
# Select: Create (single record)
# Include relation "user"? No
# Include relation "tagsToPosts"? Yes
# Skip junction table? Yes
# Public endpoint? No
```

This generates:
- `src/modules/posts/dto/create-post.dto.ts`
- `src/modules/posts/posts.service.ts` (with create method)
- `src/modules/posts/posts.controller.ts` (with POST endpoint)
- `src/modules/posts/posts.module.ts`
- Updates `src/app.module.ts`

### Generate a Read Many Endpoint

```bash
npm run generate:endpoint
# Select: posts
# Select: Read Many (with pagination)
# Include relation "user"? Yes
# Include relation "tagsToPosts"? No
# Pagination type? Both
# Public endpoint? Yes
```

This generates a paginated endpoint with cursor and offset support, includes the user relation, and is publicly accessible.

## Features

- ✅ Runtime schema introspection
- ✅ Recursive relation handling
- ✅ Junction table detection and simplification
- ✅ Automatic DTO generation with validators
- ✅ Custom pagination support (cursor/offset/both)
- ✅ Transaction support for complex creates
- ✅ Replace delete functionality
- ✅ Automatic module registration
- ✅ TypeScript with full type safety

## Troubleshooting

### "generalSelect not found" error

Make sure your schema exports the `generalSelect` object for each table.

### Module not added to app.module.ts

Check that `app.module.ts` exists at `src/app.module.ts` and has a valid `@Module()` decorator with an `imports` array.

### Inquirer prompts not showing

Make sure you're running the command in an interactive terminal (not via CI/CD or scripts).

