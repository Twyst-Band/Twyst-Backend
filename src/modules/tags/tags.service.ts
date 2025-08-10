import { Injectable } from '@nestjs/common';
import { CommonService } from '@common/services/common.service';
import { tags } from '@schema/tags';

@Injectable()
export class TagsService extends CommonService {
  async getTags() {
    return this.db
      .select({ id: tags.id, name: tags.name })
      .from(tags)
      .orderBy(tags.name);
  }
}
