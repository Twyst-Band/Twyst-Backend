import { posts } from '@schema/posts';
import {
  BasePaginationDto,
  Filter,
  Pagination,
  Prop,
  Sortable
} from 'nest-drizzle-pagination';

@Pagination({
  paginationType: 'cursor',
  limit: 10,
  defaultSort: [{ field: posts.id, order: 'ASC' }],
  allowCustomSort: true,
  allowCustomLimit: true,
  allowMultipleSort: false,
  maxLimit: 100,
  cursorIdField: posts.id
})
export class FindPostsDto extends BasePaginationDto {
  @Prop(posts.id)
  @Filter('eq', 'gt', 'lt', 'gte', 'lte')
  @Sortable()
  id?: number;

  @Prop(posts.title)
  @Filter('eq', 'like')
  @Sortable()
  title?: string;

  @Prop(posts.content)
  @Filter('eq', 'like')
  @Sortable()
  content?: string;

  @Prop(posts.userID)
  @Filter('eq', 'gt', 'lt', 'gte', 'lte')
  @Sortable()
  userID?: number;

  @Prop(posts.createdAt)
  @Filter('eq', 'gt', 'lt')
  @Sortable()
  createdAt?: Date;

  @Prop(posts.updatedAt)
  @Filter('eq', 'gt', 'lt')
  @Sortable()
  updatedAt?: Date;
}
