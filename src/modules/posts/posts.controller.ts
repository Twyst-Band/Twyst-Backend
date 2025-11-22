import { Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import { PostsService } from './posts.service';
import { postRelations, posts } from '@schema/posts';
import { createMany, createOne } from 'drizzle-orm';
import { users } from '@schema/users';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {
    console.log(
      postRelations.config({
        one: createOne(postRelations.table),
        many: createMany(postRelations.table)
      })
    );
  }

  @Post()
  createPost() {
    // Create with tags?
    // Create with user?
  }

  @Get(':id')
  getPost() {
    // include tags?
    //include user?
  }

  // Should include pagination, tags and the user, if relations are made correctly. There should be an option to either add or not tags
  @Get()
  getAllPosts() {
    // Use cursor or limit pagination?
    // include tags?
    // include user?
  }

  @Patch()
  updatePost() {
    // Update tags?
    // Update user?
  }

  @Delete()
  deletePost() {
    // Smart delete?
  }
}
