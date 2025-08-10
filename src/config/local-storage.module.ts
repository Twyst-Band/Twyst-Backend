import { ClsModule } from 'nestjs-cls';

export const LocalStorageModule = ClsModule.forRoot({
  global: true,
  middleware: {
    mount: true
  }
});
