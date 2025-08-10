import { Injectable } from '@nestjs/common';
import { CommonService } from '@common/services/common.service';
import { exercises, exerciseAccessEnum } from '@schema/exercises';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { and, eq, inArray } from 'drizzle-orm';
import { workoutCategories } from '@schema/workout-categories';
import { firstRow } from '@common/utils/drizzle.utils';
import { throwBadRequestException } from '@common/exceptions/bad-request.exception';
import { tags } from '@schema/tags';
import { equipment } from '@schema/equipment';
import { exercisesToTags } from '@schema/exercises-to-tags';
import { exercisesToEquipment } from '@schema/exercises-to-equipment';
import { throwForbiddenException } from '@common/exceptions/forbidden-exception';
import { throwNotFound } from '@common/exceptions/not-found.exception';
import { SearchExercisesDto } from './dto/search-exercises.dto';
import { sql } from 'drizzle-orm';
// duplicates removed

@Injectable()
export class ExerciseService extends CommonService {
  private async assertTagsExist(tagIDs: number[]) {
    if (!tagIDs?.length) return;
    const rows = await this.db.select({ id: tags.id }).from(tags).where(inArray(tags.id, tagIDs));
    const found = new Set(rows.map((r) => r.id));
    const missing = tagIDs.filter((id) => !found.has(id));
    if (missing.length) throwBadRequestException(`Unknown tag IDs: ${missing.join(',')}`);
  }

  private async assertEquipmentExist(equipmentIDs: number[]) {
    if (!equipmentIDs?.length) return;
    const rows = await this.db.select({ id: equipment.id }).from(equipment).where(inArray(equipment.id, equipmentIDs));
    const found = new Set(rows.map((r) => r.id));
    const missing = equipmentIDs.filter((id) => !found.has(id));
    if (missing.length) throwBadRequestException(`Unknown equipment IDs: ${missing.join(',')}`);
  }

  private async assertCategoryExists(categoryID: number) {
    const category = await firstRow(
      this.db.select({ id: workoutCategories.id }).from(workoutCategories).where(eq(workoutCategories.id, categoryID)).limit(1)
    );
    if (!category) throwBadRequestException('Unknown workout category');
  }

  async create(dto: CreateExerciseDto) {
    await this.assertCategoryExists(dto.categoryID);
    await this.assertTagsExist(dto.tagIDs);
    await this.assertEquipmentExist(dto.equipmentIDs);

    const [created] = await this.db
      .insert(exercises)
      .values({
        name: dto.name,
        description: dto.description,
        difficulty: dto.difficulty,
        categoryID: dto.categoryID,
        access: dto.access,
        ownerID: this.userID,
        ref: 'TODO_MONGO_REF' // TODO: reference to MongoDB movement data
      })
      .returning({ id: exercises.id });

    if (dto.tagIDs?.length) {
      await this.db.insert(exercisesToTags).values(
        dto.tagIDs.map((tagID) => ({ exerciseID: created.id, tagID }))
      );
    }
    if (dto.equipmentIDs?.length) {
      await this.db.insert(exercisesToEquipment).values(
        dto.equipmentIDs.map((equipmentID) => ({ exerciseID: created.id, equipmentID }))
      );
    }

    return { id: created.id };
  }

  async listMine() {
    return this.db
      .select({
        id: exercises.id,
        name: exercises.name,
        description: exercises.description,
        difficulty: exercises.difficulty,
        categoryID: exercises.categoryID,
        access: exercises.access,
        ownerID: exercises.ownerID,
        ref: exercises.ref
      })
      .from(exercises)
      .where(eq(exercises.ownerID, this.userID));
  }

  private async ensureCanAccess(exerciseID: number) {
    const row = await firstRow(
      this.db
        .select({ id: exercises.id, ownerID: exercises.ownerID, access: exercises.access })
        .from(exercises)
        .where(eq(exercises.id, exerciseID))
        .limit(1)
    );
    if (!row) throwNotFound('Exercise not found');
    if (row.access === 'private' && row.ownerID !== this.userID) {
      throwForbiddenException('You do not have access to this exercise');
    }
    return row;
  }

  private async ensureOwner(exerciseID: number) {
    const row = await firstRow(
      this.db.select({ ownerID: exercises.ownerID }).from(exercises).where(eq(exercises.id, exerciseID)).limit(1)
    );
    if (!row) throwNotFound('Exercise not found');
    if (row.ownerID !== this.userID) throwForbiddenException('Only the owner can modify this exercise');
  }

  async getOne(id: number) {
    await this.ensureCanAccess(id);
    // Basic metadata; relations can be fetched in dedicated endpoints if needed
    const row = await firstRow(
      this.db
        .select({
          id: exercises.id,
          name: exercises.name,
          description: exercises.description,
          difficulty: exercises.difficulty,
          categoryID: exercises.categoryID,
          access: exercises.access,
          ownerID: exercises.ownerID,
          ref: exercises.ref
        })
        .from(exercises)
        .where(eq(exercises.id, id))
        .limit(1)
    );
    return row;
  }

  async update(id: number, dto: UpdateExerciseDto) {
    await this.ensureOwner(id);
    if (dto.categoryID) await this.assertCategoryExists(dto.categoryID);
    if (dto.tagIDs) await this.assertTagsExist(dto.tagIDs);
    if (dto.equipmentIDs) await this.assertEquipmentExist(dto.equipmentIDs);

    const [updated] = await this.db
      .update(exercises)
      .set({
        name: dto.name,
        description: dto.description,
        difficulty: dto.difficulty,
        categoryID: dto.categoryID,
        access: dto.access
      })
      .where(eq(exercises.id, id))
      .returning({ id: exercises.id });

    if (!updated) throwNotFound('Exercise not found');

    if (dto.tagIDs) {
      await this.db.delete(exercisesToTags).where(eq(exercisesToTags.exerciseID, id));
      await this.db.insert(exercisesToTags).values(dto.tagIDs.map((tagID) => ({ exerciseID: id, tagID })));
    }
    if (dto.equipmentIDs) {
      await this.db.delete(exercisesToEquipment).where(eq(exercisesToEquipment.exerciseID, id));
      await this.db.insert(exercisesToEquipment).values(dto.equipmentIDs.map((equipmentID) => ({ exerciseID: id, equipmentID })));
    }

    return { id: updated.id };
  }

  async remove(id: number) {
    await this.ensureOwner(id);
    const [deleted] = await this.db.delete(exercises).where(eq(exercises.id, id)).returning({ id: exercises.id });
    if (!deleted) throwNotFound('Exercise not found');
    return { ok: true };
  }

  async searchPublic(query: SearchExercisesDto) {
    const { q, minDifficulty, maxDifficulty, categoryID, tagIDs, equipmentIDs, match, page, pageSize, sortBy, sortDir } = query;

    const conditions = [eq(exercises.access, 'public' as any)];
    if (q) {
      conditions.push(sql`${exercises.name} ILIKE ${'%' + q + '%'}`);
    }
    if (minDifficulty !== undefined) {
      conditions.push(sql`${exercises.difficulty} >= ${minDifficulty}`);
    }
    if (maxDifficulty !== undefined) {
      conditions.push(sql`${exercises.difficulty} <= ${maxDifficulty}`);
    }
    if (categoryID !== undefined) {
      conditions.push(eq(exercises.categoryID, categoryID));
    }

    // Base query
    const base = this.db
      .select({
        id: exercises.id,
        name: exercises.name,
        description: exercises.description,
        difficulty: exercises.difficulty,
        categoryID: exercises.categoryID,
      })
      .from(exercises)
      .where(and(...conditions));

    // Tag filter
    if (tagIDs?.length) {
      const sub = this.db
        .select({ exerciseID: exercisesToTags.exerciseID })
        .from(exercisesToTags)
        .where(inArray(exercisesToTags.tagID, tagIDs))
        .groupBy(exercisesToTags.exerciseID)
        .having(match === 'all' ? sql`COUNT(DISTINCT ${exercisesToTags.tagID}) = ${tagIDs.length}` : undefined);
      (base as any).where(inArray(exercises.id, sub as unknown as any));
    }

    // Equipment filter
    if (equipmentIDs?.length) {
      const sub = this.db
        .select({ exerciseID: exercisesToEquipment.exerciseID })
        .from(exercisesToEquipment)
        .where(inArray(exercisesToEquipment.equipmentID, equipmentIDs))
        .groupBy(exercisesToEquipment.exerciseID)
        .having(match === 'all' ? sql`COUNT(DISTINCT ${exercisesToEquipment.equipmentID}) = ${equipmentIDs.length}` : undefined);
      (base as any).where(inArray(exercises.id, sub as unknown as any));
    }

    const orderBy = sortBy === 'difficulty' ? exercises.difficulty : exercises.name;
    const orderDir = sortDir === 'desc' ? sql`DESC` : sql`ASC`;

    // Count
    const [{ count }] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(base.as('b'));

    // Page
    const items = await base
      .orderBy(sql`${orderBy} ${orderDir}`)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return { total: Number(count), page, pageSize, items };
  }
}
