import { Controller, Get, Param, Post, Delete, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post(':id/follow')
  async follow(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.followUser(id);
  }

  @Delete(':id/follow')
  async unfollow(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.unfollowUser(id);
  }

  @Get(':id')
  async getUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserProfile(id);
  }

  @Get(':id/followers')
  async getFollowers(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getFollowers(id);
  }

  @Get(':id/follows')
  async getFollows(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getFollows(id);
  }
}


