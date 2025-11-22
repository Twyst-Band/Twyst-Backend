# Resource Generator - Quick Start Guide

## Overview

This project includes a custom NestJS schematic that generates complete CRUD endpoints with Drizzle ORM integration. The generator uses interactive CLI prompts to guide you through the process.

## How to Use

### Step 1: Run the Generator

```bash
npm run generate:endpoint
```

### Step 2: Answer the Prompts

The generator will ask you a series of questions:

#### 1. Select a Table
```
? Which table would you like to use? (Use arrow keys)
❯ emailVerificationTokens
  passwordResetTokens
  posts
  tags
  tagsToPosts
  users
```

Choose the database table you want to create an endpoint for.

#### 2. Select Endpoint Type
```
? What kind of endpoint do you want? (Use arrow keys)
❯ Create (single record)
  Read (single record)
  Update (single record)
  Delete (single record)
  Create Many (multiple records)
  Read Many (with pagination)
  Update Many (multiple records)
  Delete Many (multiple records)
```

#### 3. Configure Relations (if applicable)
For Create and Read endpoints, you'll be asked about relations:

```
? Include relation "user" (one -> users)? (y/N)
? Include relation "tagsToPosts" (many -> tagsToPosts)? (y/N)
```

If you select a junction table:
```
? tagsToPosts appears to be a junction table. Skip it and include related entities directly? (Y/n)
```

For nested relations:
```
? Include nested relations for users? (y/N)
```

#### 4. Delete Configuration (for Delete endpoints)
```
? What kind of delete operation? (Use arrow keys)
❯ Normal delete (remove from database)
  Replace delete (replace with default values)
```

Note: "Replace delete" only appears if the table has a `statusField` configured.

#### 5. Pagination Type (for Read Many)
```
? What kind of pagination? (Use arrow keys)
❯ Both (cursor and offset)
  Cursor-based only
  Offset-based only
```

#### 6. Public Access
```
? Should this endpoint be public (skip authentication)? (y/N)
```

### Step 3: Review Generated Files

The generator creates:

```
src/modules/{table}/
├── dto/
│   ├── create-{table}.dto.ts    # Create DTO
│   ├── update-{table}.dto.ts    # Update DTO
│   ├── find-{table}s.dto.ts     # Pagination DTO
│   └── index.ts                 # DTO exports
├── {table}.controller.ts         # HTTP endpoints
├── {table}.service.ts            # Business logic
└── {table}.module.ts             # NestJS module
```

And automatically updates:
- `src/app.module.ts` - Adds the new module to imports

## Examples

### Example 1: Create a Simple Post

```bash
npm run generate:endpoint

# Prompts:
? Which table would you like to use? posts
? What kind of endpoint do you want? Create (single record)
? Include relation "user" (one -> users)? No
? Include relation "tagsToPosts" (many -> tagsToPosts)? No
? Should this endpoint be public (skip authentication)? No
```

**Result**: Creates a POST `/posts` endpoint that creates a single post.

### Example 2: Create Post with Tags

```bash
npm run generate:endpoint

# Prompts:
? Which table would you like to use? posts
? What kind of endpoint do you want? Create (single record)
? Include relation "user" (one -> users)? No
? Include relation "tagsToPosts" (many -> tagsToPosts)? Yes
? tagsToPosts appears to be a junction table. Skip it and include related entities directly? Yes
? Should this endpoint be public (skip authentication)? No
```

**Result**: Creates a POST `/posts` endpoint that accepts:
```typescript
{
  title: string;
  content: string;
  userID: string;
  tagsToPosts: number[]; // Array of tag IDs
}
```

### Example 3: Read Many with Pagination

```bash
npm run generate:endpoint

# Prompts:
? Which table would you like to use? posts
? What kind of endpoint do you want? Read Many (with pagination)
? Include relation "user" (one -> users)? Yes
? Include nested relations for users? No
? Include relation "tagsToPosts" (many -> tagsToPosts)? No
? What kind of pagination? Both (cursor and offset)
? Should this endpoint be public (skip authentication)? Yes
```

**Result**: Creates a GET `/posts` endpoint with pagination support:
```
GET /posts?page=1&limit=10                    # Offset pagination
GET /posts?cursor=abc123&limit=10             # Cursor pagination
GET /posts?sort=createdAt:desc&filter=title:like:hello
```

### Example 4: Soft Delete (Replace Delete)

First, ensure your schema has delete replace configured:
```typescript
export const postsDeleteReplace = {
  statusField: 'status',
  replaceValues: {
    title: '[Deleted Post]',
    content: '[This post has been deleted]'
  }
};
```

Then run:
```bash
npm run generate:endpoint

# Prompts:
? Which table would you like to use? posts
? What kind of endpoint do you want? Delete (single record)
? What kind of delete operation? Replace delete (replace with default values)
? Should this endpoint be public (skip authentication)? No
```

**Result**: Creates a DELETE `/posts/:id` endpoint that updates the post with deleted values instead of removing it.

## Tips

1. **Always build first**: Run `npm run build:schematics` if you've made changes to the generator code.

2. **Module already exists**: If the module directory exists, the generator will skip files that already exist. You may need to manually merge or delete existing files.

3. **Relation depth**: Be careful with nested relations to avoid circular dependencies. The generator tracks visited tables but deeply nested structures can be complex.

4. **Junction tables**: The generator detects junction tables (like `tagsToPosts`) and offers to simplify them to arrays of IDs in your DTOs.

5. **Dry run**: To see what would be generated without making changes:
   ```bash
   schematics ./schematics/collection.json:endpoint --dry-run=true
   ```

## Troubleshooting

### Error: "generalSelect not found"

Each table schema must export a `generalSelect` object:
```typescript
export const postsGeneralSelect = {
  id: true,
  title: true,
  content: true,
  // ... all columns you want to return
};
```

### Prompts not showing

Make sure you're in an interactive terminal. The `--no-interactive` flag disables prompts.

### Module not added to app.module.ts

Check that:
- `src/app.module.ts` exists
- It has a valid `@Module()` decorator
- It has an `imports` array

### TypeScript errors after generation

Run `npm run build` to check for errors. You may need to adjust imports or add missing dependencies.

## Next Steps

After generating endpoints:

1. **Review the generated code** - Make sure it matches your requirements
2. **Customize as needed** - The generated code is a starting point
3. **Add validation** - Enhance DTOs with custom validators
4. **Add business logic** - Implement complex logic in the service
5. **Test your endpoints** - Use Postman, curl, or automated tests
6. **Add documentation** - Use Swagger decorators for API docs

## Need Help?

See `schematics/README.md` for detailed documentation on how the generator works.

