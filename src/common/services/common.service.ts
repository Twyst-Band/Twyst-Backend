import { Inject } from '@nestjs/common';
import { ClsService, ClsStore } from 'nestjs-cls';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { UserRole } from '@common/types';

export interface CustomClsStore extends ClsStore {
  userID: number;
  role: UserRole;
}

export abstract class CommonService {
  @Inject('DB')
  protected readonly db: NodePgDatabase;

  @Inject()
  private readonly clsService: ClsService<CustomClsStore>;

  protected get userID(): number {
    return this.clsService.get('userID');
  }

  protected get role(): UserRole {
    return this.clsService.get('role');
  }
}
