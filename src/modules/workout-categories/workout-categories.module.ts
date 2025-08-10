import { Module } from '@nestjs/common';
import { WorkoutCategoriesService } from './workout-categories.service';
import { WorkoutCategoriesController } from './workout-categories.controller';

@Module({
  controllers: [WorkoutCategoriesController],
  providers: [WorkoutCategoriesService],
})
export class WorkoutCategoriesModule {}
