import { Injectable } from '@nestjs/common';
import { CommonService } from '@common/services/common.service';
import { workoutCategories } from '@schema/workout-categories';

@Injectable()
export class WorkoutCategoriesService extends CommonService {
  async getWorkoutCategories() {
    return this.db
      .select({ id: workoutCategories.id, name: workoutCategories.name })
      .from(workoutCategories)
      .orderBy(workoutCategories.name);
  }
}
