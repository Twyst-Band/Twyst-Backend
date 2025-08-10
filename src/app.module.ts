import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthenticatedGuard } from '@guards/authenticated.guard';
import { AuthModule } from '@modules/auth/auth.module';
import { DatabaseModule } from '@config/database.module';
import { LocalStorageModule } from '@config/local-storage.module';
import { AccountModule } from './modules/account/account.module';
import { UsersModule } from './modules/users/users.module';
import { BodyProfileModule } from './modules/body-profile/body-profile.module';
import { TagsModule } from './modules/tags/tags.module';
import { EquipmentModule } from './modules/equipment/equipment.module';
import { WorkoutCategoriesModule } from './modules/workout-categories/workout-categories.module';
import { ExerciseModule } from './modules/exercise/exercise.module';

@Module({
  imports: [DatabaseModule, LocalStorageModule, AuthModule, AccountModule, UsersModule, BodyProfileModule, TagsModule, EquipmentModule, WorkoutCategoriesModule, ExerciseModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthenticatedGuard
    }
  ]
})
export class AppModule {}
