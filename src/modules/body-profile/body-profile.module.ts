import { Module } from '@nestjs/common';
import { BodyProfileService } from './body-profile.service';
import { BodyProfileController } from './body-profile.controller';

@Module({
  controllers: [BodyProfileController],
  providers: [BodyProfileService],
})
export class BodyProfileModule {}
