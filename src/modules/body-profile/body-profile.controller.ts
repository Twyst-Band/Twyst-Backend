import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { BodyProfileService } from './body-profile.service';
import { CreateBodyProfileDto } from './dto/create-body-profile.dto';
import { UpdateBodyProfileDto } from './dto/update-body-profile.dto';

@Controller('body-profile')
export class BodyProfileController {
  constructor(private readonly bodyProfileService: BodyProfileService) {}

  @Post()
  create(@Body() dto: CreateBodyProfileDto) {
    return this.bodyProfileService.create(dto);
  }

  @Get()
  findAllMine() {
    return this.bodyProfileService.findAllMine();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bodyProfileService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBodyProfileDto) {
    return this.bodyProfileService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bodyProfileService.remove(id);
  }
}
