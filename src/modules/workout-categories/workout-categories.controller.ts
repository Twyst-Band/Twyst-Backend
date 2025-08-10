import { Controller, Get } from '@nestjs/common';
import { WorkoutCategoriesService } from './workout-categories.service';
import { Public } from '@common/decorators/public.decorator';

@Controller('workout-categories')
export class WorkoutCategoriesController {
  constructor(private readonly workoutCategoriesService: WorkoutCategoriesService) {}

  @Get()
  @Public()
  getWorkoutCategories() {
    return this.workoutCategoriesService.getWorkoutCategories();
  }
}
