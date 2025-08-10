import { Injectable } from '@nestjs/common';
import { CommonService } from '@common/services/common.service';
import { equipment } from '@schema/equipment';
import { equipmentCategories } from '@schema/equipment-categories';
import { eq } from 'drizzle-orm';
import { jsonAgg, jsonBuildObject } from '@common/utils/drizzle.utils';

@Injectable()
export class EquipmentService extends CommonService {
  async getEquipmentByCategory() {
    return this.db
      .select({
        id: equipmentCategories.id,
        name: equipmentCategories.name,
        equipment: jsonAgg(
          jsonBuildObject({ id: equipment.id, name: equipment.name }),
          equipment.id
        )
      })
      .from(equipmentCategories)
      .leftJoin(equipment, eq(equipment.categoryID, equipmentCategories.id))
      .groupBy(equipmentCategories.id);
  }
}
