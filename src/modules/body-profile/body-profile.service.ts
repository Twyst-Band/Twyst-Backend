import { Injectable } from '@nestjs/common';
import { CommonService } from '@common/services/common.service';
import { bodyProfiles } from '@schema/body-profiles';
import { CreateBodyProfileDto } from './dto/create-body-profile.dto';
import { UpdateBodyProfileDto } from './dto/update-body-profile.dto';
import { and, eq } from 'drizzle-orm';
import { firstRow } from '@common/utils/drizzle.utils';
import { throwNotFound } from '@common/exceptions/not-found.exception';

@Injectable()
export class BodyProfileService extends CommonService {
  async create(dto: CreateBodyProfileDto) {
    const [created] = await this.db
      .insert(bodyProfiles)
      .values({
        name: dto.name,
        userID: this.userID,
        addedManually: dto.addedManually,
        detectionDump: dto.addedManually ? null : dto.detectionDump ?? null,
        leftLowerArm: dto.leftLowerArm,
        rightLowerArm: dto.rightLowerArm,
        leftUpperArm: dto.leftUpperArm,
        rightUpperArm: dto.rightUpperArm,
        leftLowerLeg: dto.leftLowerLeg,
        rightLowerLeg: dto.rightLowerLeg,
        leftUpperLeg: dto.leftUpperLeg,
        rightUpperLeg: dto.rightUpperLeg,
        leftTorso: dto.leftTorso,
        rightTorso: dto.rightTorso,
        hip: dto.hip,
        shoulders: dto.shoulders
      })
      .returning({ id: bodyProfiles.id });
    return { id: created.id };
  }

  async findAllMine() {
    return this.db
      .select({
        id: bodyProfiles.id,
        name: bodyProfiles.name,
        addedManually: bodyProfiles.addedManually,
        detectionDump: bodyProfiles.detectionDump,
        leftLowerArm: bodyProfiles.leftLowerArm,
        rightLowerArm: bodyProfiles.rightLowerArm,
        leftUpperArm: bodyProfiles.leftUpperArm,
        rightUpperArm: bodyProfiles.rightUpperArm,
        leftLowerLeg: bodyProfiles.leftLowerLeg,
        rightLowerLeg: bodyProfiles.rightLowerLeg,
        leftUpperLeg: bodyProfiles.leftUpperLeg,
        rightUpperLeg: bodyProfiles.rightUpperLeg,
        leftTorso: bodyProfiles.leftTorso,
        rightTorso: bodyProfiles.rightTorso,
        hip: bodyProfiles.hip,
        shoulders: bodyProfiles.shoulders
      })
      .from(bodyProfiles)
      .where(eq(bodyProfiles.userID, this.userID));
  }

  async findOne(id: number) {
    const row = await firstRow(
      this.db
        .select({
          id: bodyProfiles.id,
          name: bodyProfiles.name,
          addedManually: bodyProfiles.addedManually,
          detectionDump: bodyProfiles.detectionDump,
          leftLowerArm: bodyProfiles.leftLowerArm,
          rightLowerArm: bodyProfiles.rightLowerArm,
          leftUpperArm: bodyProfiles.leftUpperArm,
          rightUpperArm: bodyProfiles.rightUpperArm,
          leftLowerLeg: bodyProfiles.leftLowerLeg,
          rightLowerLeg: bodyProfiles.rightLowerLeg,
          leftUpperLeg: bodyProfiles.leftUpperLeg,
          rightUpperLeg: bodyProfiles.rightUpperLeg,
          leftTorso: bodyProfiles.leftTorso,
          rightTorso: bodyProfiles.rightTorso,
          hip: bodyProfiles.hip,
          shoulders: bodyProfiles.shoulders
        })
        .from(bodyProfiles)
        .where(and(eq(bodyProfiles.id, id), eq(bodyProfiles.userID, this.userID)))
        .limit(1)
    );
    if (!row) throwNotFound('Body profile not found');
    return row;
  }

  async update(id: number, dto: UpdateBodyProfileDto) {
    const [updated] = await this.db
      .update(bodyProfiles)
      .set({
        name: dto.name,
        addedManually: dto.addedManually,
        detectionDump: dto.addedManually === false ? dto.detectionDump ?? null : null,
        leftLowerArm: dto.leftLowerArm,
        rightLowerArm: dto.rightLowerArm,
        leftUpperArm: dto.leftUpperArm,
        rightUpperArm: dto.rightUpperArm,
        leftLowerLeg: dto.leftLowerLeg,
        rightLowerLeg: dto.rightLowerLeg,
        leftUpperLeg: dto.leftUpperLeg,
        rightUpperLeg: dto.rightUpperLeg,
        leftTorso: dto.leftTorso,
        rightTorso: dto.rightTorso,
        hip: dto.hip,
        shoulders: dto.shoulders
      })
      .where(and(eq(bodyProfiles.id, id), eq(bodyProfiles.userID, this.userID)))
      .returning({ id: bodyProfiles.id });
    if (!updated) throwNotFound('Body profile not found');
    return { id: updated.id };
  }

  async remove(id: number) {
    const [deleted] = await this.db
      .delete(bodyProfiles)
      .where(and(eq(bodyProfiles.id, id), eq(bodyProfiles.userID, this.userID)))
      .returning({ id: bodyProfiles.id });
    if (!deleted) throwNotFound('Body profile not found');
    return { ok: true };
  }
}
