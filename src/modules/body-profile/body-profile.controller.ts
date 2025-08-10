import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { BodyProfileService } from './body-profile.service';
import { CreateBodyProfileDto } from './dto/create-body-profile.dto';
import { UpdateBodyProfileDto } from './dto/update-body-profile.dto';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('body-profile')
@Controller('body-profile')
export class BodyProfileController {
  constructor(private readonly bodyProfileService: BodyProfileService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new body profile' })
  @ApiCreatedResponse({ description: 'Body profile created' })
  @ApiBadRequestResponse({ description: 'Validation error' })
  create(@Body() dto: CreateBodyProfileDto) {
    return this.bodyProfileService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List my body profiles' })
  @ApiOkResponse({ description: 'Returns an array of body profiles' })
  findAllMine() {
    return this.bodyProfileService.findAllMine();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one of my body profiles by id' })
  @ApiOkResponse({ description: 'Returns the body profile' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bodyProfileService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update one of my body profiles' })
  @ApiOkResponse({ description: 'Returns the id of the updated profile' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBodyProfileDto) {
    return this.bodyProfileService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete one of my body profiles' })
  @ApiOkResponse({ description: 'Deletion successful' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bodyProfileService.remove(id);
  }
}
