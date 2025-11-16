import { Inject } from '@nestjs/common';
import { ClsService, ClsStore } from 'nestjs-cls';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@schema/index';

export interface CustomClsStore extends ClsStore {
  userID: number;
}

export abstract class CommonService {
  @Inject('DB')
  protected readonly db: NodePgDatabase<typeof schema>;

  @Inject()
  private readonly clsService: ClsService<CustomClsStore>;

  protected get userID(): number {
    return this.clsService.get('userID');
  }

  protected get query() {
    return this.db.query;
  }
}
