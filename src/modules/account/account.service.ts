import { Injectable } from '@nestjs/common';
import { CommonService } from '@common/services/common.service';
import { firstRow } from '@common/utils/drizzle.utils';
import { users } from '@schema/users';
import { eq } from 'drizzle-orm';
import { throwConflictException } from '@common/exceptions/conflict.exception';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountService extends CommonService {
  async getCurrentAccount() {
    return firstRow(
      this.db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          userName: users.userName,
          emailVerified: users.emailVerified
        })
        .from(users)
        .where(eq(users.id, this.userID))
        .limit(1)
    );
  }

  async updateAccount(dto: UpdateAccountDto) {
    try {
      const [updated] = await this.db
        .update(users)
        .set(dto)
        .where(eq(users.id, this.userID))
        .returning({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          userName: users.userName,
          emailVerified: users.emailVerified
        });
      return updated;
    } catch (e: any) {
      if (e?.code === '23505') {
        throwConflictException('Username already in use');
      }
      
      throw e;
    }
  }
}
