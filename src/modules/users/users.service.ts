import { Injectable } from '@nestjs/common';
import { CommonService } from '@common/services/common.service';
import { users } from '@schema/users';
import { and, eq, exists, sql } from 'drizzle-orm';
import { firstRow } from '@common/utils/drizzle.utils';
import { follows } from '@schema/follows';
import { throwNotFound } from '@common/exceptions/not-found.exception';
import { throwBadRequestException } from '@common/exceptions/bad-request.exception';

@Injectable()
export class UsersService extends CommonService {
  async followUser(targetUserId: number) {
    if (targetUserId === this.userID) {
      throwBadRequestException('Cannot follow yourself');
    }

    const targetExists = await firstRow(
      this.db.select({ id: users.id }).from(users).where(eq(users.id, targetUserId)).limit(1)
    );
    if (!targetExists) throwNotFound('User not found');

    const result = await this.db
      .insert(follows)
      .values({ followerID: this.userID, followeeID: targetUserId })
      .onConflictDoNothing()
      .returning({ followerID: follows.followerID });

    // Only increment counts if a new row was inserted
    if (result.length > 0) {
      await this.db
        .update(users)
        .set({ followsCount: sql`${users.followsCount} + 1` })
        .where(eq(users.id, this.userID));
      await this.db
        .update(users)
        .set({ followersCount: sql`${users.followersCount} + 1` })
        .where(eq(users.id, targetUserId));
    }

    return { ok: true };
  }

  async unfollowUser(targetUserId: number) {
    const deleted = await this.db
      .delete(follows)
      .where(and(eq(follows.followerID, this.userID), eq(follows.followeeID, targetUserId)))
      .returning({ followerID: follows.followerID });

    if (deleted.length > 0) {
      await this.db
        .update(users)
        .set({ followsCount: sql`${users.followsCount} - 1` })
        .where(eq(users.id, this.userID));
      await this.db
        .update(users)
        .set({ followersCount: sql`${users.followersCount} - 1` })
        .where(eq(users.id, targetUserId));
    }
    return { ok: true };
  }

  private relationshipBooleans(targetId: number) {
    const iFollow = exists(
      this.db
        .select({ one: sql`1` })
        .from(follows)
        .where(and(eq(follows.followerID, this.userID), eq(follows.followeeID, targetId)))
    );
    const followsMe = exists(
      this.db
        .select({ one: sql`1` })
        .from(follows)
        .where(and(eq(follows.followerID, targetId), eq(follows.followeeID, this.userID)))
    );
    
    return { iFollow, followsMe };
  }

  async getUserProfile(targetUserId: number) {
    const rel = this.relationshipBooleans(targetUserId);
    const user = await firstRow(
      this.db
        .select({
          id: users.id,
          userName: users.userName,
          customization: users.customization,
          followersCount: users.followersCount,
          followsCount: users.followsCount,
          iFollow: rel.iFollow,
          followsMe: rel.followsMe
        })
        .from(users)
        .where(eq(users.id, targetUserId))
        .limit(1)
    );
    if (!user) throwNotFound('User not found');
    return user;
  }

  // customization updates moved to account module

  async getFollowers(targetUserId: number) {
    // users who follow targetUserId
    const rows = await this.db
      .select({
        id: users.id,
        userName: users.userName,
        iFollow: exists(
          this.db
            .select({ one: sql`1` })
            .from(follows)
            .where(and(eq(follows.followerID, this.userID), eq(follows.followeeID, users.id)))
        ),
        followsMe: exists(
          this.db
            .select({ one: sql`1` })
            .from(follows)
            .where(and(eq(follows.followerID, users.id), eq(follows.followeeID, this.userID)))
        )
      })
      .from(follows)
      .innerJoin(users, eq(users.id, follows.followerID))
      .where(eq(follows.followeeID, targetUserId));
    return rows;
  }

  async getFollows(targetUserId: number) {
    // users that targetUserId follows
    const rows = await this.db
      .select({
        id: users.id,
        userName: users.userName,
        iFollow: exists(
          this.db
            .select({ one: sql`1` })
            .from(follows)
            .where(and(eq(follows.followerID, this.userID), eq(follows.followeeID, users.id)))
        ),
        followsMe: exists(
          this.db
            .select({ one: sql`1` })
            .from(follows)
            .where(and(eq(follows.followerID, users.id), eq(follows.followeeID, this.userID)))
        )
      })
      .from(follows)
      .innerJoin(users, eq(users.id, follows.followeeID))
      .where(eq(follows.followerID, targetUserId));
    return rows;
  }
}


