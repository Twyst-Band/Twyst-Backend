# Quick Start - Resource Generator

## 🚀 Generate Your First Endpoint

```bash
npm run generate:endpoint
```

That's it! The interactive CLI will guide you through the rest.

## 📋 What You'll Be Asked

1. **Which table?** - Select from: users, posts, tags, etc.
2. **What endpoint type?** - Create, Read, Update, Delete (+ Many variants)
3. **Include relations?** - Choose which related tables to include
4. **Delete type?** - Normal or Replace (soft delete)
5. **Pagination?** - Cursor, Offset, or Both (for Read Many)
6. **Public?** - Skip authentication? Yes/No

## ✨ Example: Create a Post Endpoint

```bash
$ npm run generate:endpoint

? Which table would you like to use? posts
? What kind of endpoint do you want? Create (single record)
? Include relation "user"? No
? Include relation "tagsToPosts"? Yes
? tagsToPosts appears to be a junction table. Skip it? Yes
? Should this endpoint be public? No

✨ Generating endpoint for table: posts
✅ Endpoint generation completed successfully!
```

**Result**: Creates POST `/posts` endpoint that accepts:
```json
{
  "title": "My Post",
  "content": "Post content",
  "userID": "user123",
  "tagsToPosts": [1, 2, 3]
}
```

## 📁 What Gets Generated

```
src/modules/posts/
├── dto/
│   ├── create-post.dto.ts       ✅ Generated
│   └── index.ts                 ✅ Generated
├── posts.controller.ts          ✅ Generated
├── posts.service.ts             ✅ Generated
└── posts.module.ts              ✅ Generated

src/app.module.ts                ✅ Auto-updated
```

## 🔧 Tips

- **Multiple endpoints**: Run the generator multiple times for the same table to add more endpoints
- **Dry run**: Add `--dry-run` to see what would be generated without creating files
- **Build first**: If you modify the generator code, run `npm run build:schematics` first

## 🎯 Common Use Cases

### Create with Relations
Select "Create" and include the relations you want to nest.

### Paginated List  
Select "Read Many" and choose your pagination type.

### Soft Delete
Select "Delete" and choose "Replace delete" (if configured).

### Bulk Operations
Select "Create Many", "Update Many", or "Delete Many".

## 🐛 Troubleshooting

**Error: "generalSelect not found"**
- Each schema table needs a `generalSelect` export (already added!)

**Prompts not showing**
- Make sure you're in an interactive terminal

**Module already exists**
- Run multiple times to add different endpoints to the same module

## 📚 Full Documentation

- `GENERATOR_USAGE.md` - Complete guide with examples
- `schematics/README.md` - Technical documentation
- `IMPLEMENTATION_SUMMARY.md` - Implementation details

---

**Ready to generate? Run:** `npm run generate:endpoint` 🚀

