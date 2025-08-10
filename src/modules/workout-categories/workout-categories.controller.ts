import { Controller, Get } from '@nestjs/common';
import { WorkoutCategoriesService } from './workout-categories.service';
import { Public } from '@common/decorators/public.decorator';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('workout-categories')
@Controller('workout-categories')
export class WorkoutCategoriesController {
  constructor(private readonly workoutCategoriesService: WorkoutCategoriesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List workout categories' })
  @ApiOkResponse({ description: 'Returns an array of categories', schema: { example: [{ id: 1, name: 'Upper Body' }, { id: 2, name: 'Lower Body' }] } })
  getWorkoutCategories() {
    return this.workoutCategoriesService.getWorkoutCategories();
  }
}
