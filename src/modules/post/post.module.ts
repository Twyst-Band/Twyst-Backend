import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { PaginationModule } from 'nest-drizzle-pagination';

@Module({
  imports: [PaginationModule],
  controllers: [PostController],
  providers: [PostService]
})
export class PostModule {}
