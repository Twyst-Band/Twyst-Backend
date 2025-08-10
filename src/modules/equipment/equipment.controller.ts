import { Controller, Get } from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { Public } from '@common/decorators/public.decorator';

@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get()
  @Public()
  getEquipment() {
    return this.equipmentService.getEquipmentByCategory();
  }
}
