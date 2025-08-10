import { Controller, Get } from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { Public } from '@common/decorators/public.decorator';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('equipment')
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List equipment grouped by category' })
  @ApiOkResponse({ description: 'Returns categories with aggregated equipment', schema: { example: [{ id: 1, name: 'Barbell', equipment: [{ id: 1, name: 'Flat Bench Press' }] }] } })
  getEquipment() {
    return this.equipmentService.getEquipmentByCategory();
  }
}
