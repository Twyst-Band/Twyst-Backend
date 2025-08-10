import { Controller, Get, Param, Post, Delete, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post(':id/follow')
  @ApiOperation({ summary: 'Follow a user by id' })
  @ApiOkResponse({ description: 'Follow created or already existed', schema: { example: { ok: true } } })
  async follow(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.followUser(id);
  }

  @Delete(':id/follow')
  @ApiOperation({ summary: 'Unfollow a user by id' })
  @ApiOkResponse({ description: 'Follow removed if it existed', schema: { example: { ok: true } } })
  async unfollow(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.unfollowUser(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a public user profile by id' })
  @ApiOkResponse({ description: 'Returns { id, userName, customization, followersCount, followsCount, iFollow, followsMe }', schema: { example: { id: 2, userName: 'bob', customization: null, followersCount: 3, followsCount: 1, iFollow: false, followsMe: true } } })
  async getUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserProfile(id);
  }

  @Get(':id/followers')
  @ApiOperation({ summary: 'List followers for a user' })
  @ApiOkResponse({ description: 'Returns array of { id, userName, iFollow, followsMe }', schema: { example: [{ id: 3, userName: 'charlie', iFollow: true, followsMe: false }] } })
  async getFollowers(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getFollowers(id);
  }

  @Get(':id/follows')
  @ApiOperation({ summary: 'List users that the given user follows' })
  @ApiOkResponse({ description: 'Returns array of { id, userName, iFollow, followsMe }', schema: { example: [{ id: 4, userName: 'dave', iFollow: false, followsMe: false }] } })
  async getFollows(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getFollows(id);
  }
}


