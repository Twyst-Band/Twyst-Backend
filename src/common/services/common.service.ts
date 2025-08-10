import { Inject } from '@nestjs/common';
import { ClsService, ClsStore } from 'nestjs-cls';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export interface CustomClsStore extends ClsStore {
  userID: number;
}

export abstract class CommonService {
  @Inject('DB')
  protected readonly db: NodePgDatabase;

  @Inject()
  private readonly clsService: ClsService<CustomClsStore>;

  protected get userID(): number {
    return this.clsService.get('userID');
  }
}
