import { Controller, Get } from '@nestjs/common';
import { PostService } from './post.service';
import { FindPostsDto } from './dto/find-posts.dto';
import { PaginatedQuery, PaginatedQueryResult } from 'nest-drizzle-pagination';

@Controller('posts')
export class PostController {
  constructor(private readonly service: PostService) {}

  @Get()
  async findAll(
    @PaginatedQuery(FindPostsDto) queryInstructions: PaginatedQueryResult
  ) {
    return this.service.findAll(queryInstructions);
  }
}
