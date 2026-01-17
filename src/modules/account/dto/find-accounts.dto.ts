import { users } from '@schema/users';
import {
  BasePaginationDto,
  Filter,
  Like,
  Pagination,
  Prop,
  Sortable
} from 'nest-drizzle-pagination';

@Pagination({
  paginationType: 'both',
  limit: 10,
  defaultSort: [
    { field: users.id, order: 'ASC' },
    { field: users.firstName, order: 'DESC' }
  ],
  allowCustomSort: true,
  allowCustomLimit: true,
  allowMultipleSort: false,
  maxLimit: 100,
  cursorIdField: users.id
})
export class FindAccountsDto extends BasePaginationDto {
  @Prop(users.id)
  @Filter('eq', 'gt', 'lt')
  @Sortable()
  id?: number;

  @Prop(users.firstName)
  @Like()
  @Sortable({ alias: 'firstName' })
  firstName?: string;

  @Prop(users.lastName)
  @Filter('like')
  @Sortable({ alias: 'lastName' })
  lastName?: string;

  @Prop(users.email)
  @Filter('eq', 'like')
  @Sortable()
  email?: string;
}
