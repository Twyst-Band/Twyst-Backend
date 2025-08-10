import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { SearchExercisesDto } from './dto/search-exercises.dto';
import { Public } from '@common/decorators/public.decorator';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('exercise')
@ApiTags('exercise')
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new exercise' })
  @ApiCreatedResponse({ description: 'Exercise created', schema: { example: { id: 12 } } })
  @ApiBadRequestResponse({ description: 'Validation error or unknown tag/equipment/category' })
  create(@Body() dto: CreateExerciseDto) {
    return this.exerciseService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List exercises owned by the current user' })
  @ApiOkResponse({ description: 'Returns an array of exercises', schema: { example: [{ id: 12, name: 'Bench Press', difficulty: 5, categoryID: 1, access: 'private' }] } })
  listMine() {
    return this.exerciseService.listMine();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an exercise by id if public or owned' })
  @ApiOkResponse({ description: 'Returns exercise details', schema: { example: { id: 12, name: 'Bench Press', description: 'Chest compound', difficulty: 5, categoryID: 1, access: 'public', ownerID: 1 } } })
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.exerciseService.getOne(id);
  }

  @Get('public/search')
  @Public()
  @ApiOperation({ summary: 'Search public exercises with filters and pagination' })
  @ApiOkResponse({ description: 'Returns paginated results with total count', schema: { example: { total: 1, page: 1, pageSize: 20, items: [{ id: 12, name: 'Bench Press', difficulty: 5, categoryID: 1 }] } } })
  searchPublic(@Query() query: SearchExercisesDto) {
    return this.exerciseService.searchPublic(query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an exercise (owner only)' })
  @ApiOkResponse({ description: 'Returns the id of the updated exercise', schema: { example: { id: 12 } } })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateExerciseDto) {
    return this.exerciseService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an exercise (owner only)' })
  @ApiOkResponse({ description: 'Deletion successful', schema: { example: { ok: true } } })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.exerciseService.remove(id);
  }
}
