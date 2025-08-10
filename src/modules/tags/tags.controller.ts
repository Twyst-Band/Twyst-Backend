import { Controller, Get } from '@nestjs/common';
import { TagsService } from './tags.service';
import { Public } from '@common/decorators/public.decorator';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all tags' })
  @ApiOkResponse({ description: 'Returns an array of tags', schema: { example: [{ id: 1, name: 'Strength' }, { id: 2, name: 'Mobility' }] } })
  getTags() {
    return this.tagsService.getTags();
  }
}
