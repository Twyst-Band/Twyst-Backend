import { Module } from '@nestjs/common';
import { DatabaseModule } from '@config/database.module';
import { LocalStorageModule } from '@config/local-storage.module';
import { AuthModule } from '@modules/auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthenticatedGuard } from '@modules/auth/guards/authenticated.guard';
import { AccountModule } from '@modules/account/account.module';
import { PaginationModule } from '@common/pagination';
import { TagsModule } from './modules/tags/tags.module';
import { PostsModule } from './modules/posts/posts.module';

@Module({
  imports: [import { PostModule } from '@modules/posts/posts.module';
    DatabaseModule,
    LocalStorageModule,
    PaginationModule,
    AuthModule,
    AccountModule,
    TagsModule,
    PostsModule,
    PostModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthenticatedGuard
    }
  ]
})
export class AppModule {}
