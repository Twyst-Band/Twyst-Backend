import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { SearchExercisesDto } from './dto/search-exercises.dto';
import { Public } from '@common/decorators/public.decorator';

@Controller('exercise')
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  @Post()
  create(@Body() dto: CreateExerciseDto) {
    return this.exerciseService.create(dto);
  }

  @Get()
  listMine() {
    return this.exerciseService.listMine();
  }

  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.exerciseService.getOne(id);
  }

  @Get('public/search')
  @Public()
  searchPublic(@Query() query: SearchExercisesDto) {
    return this.exerciseService.searchPublic(query);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateExerciseDto) {
    return this.exerciseService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.exerciseService.remove(id);
  }
}
