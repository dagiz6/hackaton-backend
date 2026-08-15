import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard, Roles } from '@thallesp/nestjs-better-auth';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { UserService } from './user.service';

@Controller('user')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('all')
  @Roles(['ADMIN'])
  @ResponseMessage('Users fetched successfully')
  async getAllUsers() {
    return this.userService.findAll();
  }

  @Get(':id')
  @ResponseMessage('User details fetched successfully')
  async getUserById(@Param('id') id: string) {
    return this.userService.findOne(id);
  }
}
