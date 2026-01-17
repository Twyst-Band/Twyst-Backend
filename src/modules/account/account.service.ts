import { Injectable } from '@nestjs/common';
import { CommonService } from '@common/services/common.service';
import { users } from '@schema/users';
import { eq } from 'drizzle-orm';
import { throwConflictException } from '@common/exceptions/conflict.exception';
import { UpdateAccountDto } from './dto/update-account.dto';
import { firstRow } from '@common/utils/drizzle.utils';
import {
  CursorPaginatedResponse,
  OffsetPaginatedResponse,
  PaginatedQueryResult,
  PaginationService
} from 'nest-drizzle-pagination';

@Injectable()
export class AccountService extends CommonService {
  constructor(private readonly paginationService: PaginationService) {
    super();
  }

  async getCurrentAccount() {
    return this.query.users.findFirst({
      where: eq(users.id, this.userID),
      columns: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        userName: true
      }
    });
  }

  async searchAccounts(
    queryInstructions: PaginatedQueryResult
  ): Promise<OffsetPaginatedResponse<any> | CursorPaginatedResponse<any>> {
    const baseQuery = this.db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        userName: users.userName,
        emailVerified: users.emailVerified
      })
      .from(users);

    return this.paginationService.execute(baseQuery, queryInstructions);
  }

  async updateAccount(updateAccountDto: UpdateAccountDto) {
    try {
      return firstRow(
        this.db
          .update(users)
          .set(updateAccountDto)
          .where(eq(users.id, this.userID))
          .returning({
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            userName: users.userName
          })
      );
    } catch (e: any) {
      if (e?.code === '23505') {
        throwConflictException('Username already in use');
      }

      throw e;
    }
  }
}
