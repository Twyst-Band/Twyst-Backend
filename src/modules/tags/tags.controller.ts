import { Controller, Get } from '@nestjs/common';
import { TagsService } from './tags.service';
import { Public } from '@common/decorators/public.decorator';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @Public()
  getTags() {
    return this.tagsService.getTags();
  }
}
