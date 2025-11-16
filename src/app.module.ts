import { Module } from '@nestjs/common';
import { DatabaseModule } from '@config/database.module';
import { LocalStorageModule } from '@config/local-storage.module';
import { AuthModule } from '@modules/auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthenticatedGuard } from '@modules/auth/guards/authenticated.guard';
import { AccountModule } from '@modules/account/account.module';

@Module({
  imports: [DatabaseModule, LocalStorageModule, AuthModule, AccountModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthenticatedGuard
    }
  ]
})
export class AppModule {}
