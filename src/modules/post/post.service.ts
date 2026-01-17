import { Injectable } from '@nestjs/common';
import { CommonService } from '@common/services/common.service';
import { posts } from '@schema/posts';
import {
  CursorPaginatedResponse,
  OffsetPaginatedResponse,
  PaginatedQueryResult,
  PaginationService
} from 'nest-drizzle-pagination';
import { jsonAgg, jsonBuildObject } from '@common/utils/drizzle.utils';
import { users } from '@schema/users';
import { eq } from 'drizzle-orm';

@Injectable()
export class PostService extends CommonService {
  constructor(private readonly paginationService: PaginationService) {
    super();
  }

  async findAll(
    queryInstructions: PaginatedQueryResult
  ): Promise<OffsetPaginatedResponse<any> | CursorPaginatedResponse<any>> {
    const postQuery = this.db
      .select({
        id: posts.id,
        title: posts.title,
        user: jsonAgg(
          jsonBuildObject({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName
          }),
          users.id
        )
      })
      .from(posts)
      .leftJoin(users, eq(posts.userID, users.id)).groupBy(posts.id);

    return this.paginationService.execute(postQuery, queryInstructions);
  }
}
