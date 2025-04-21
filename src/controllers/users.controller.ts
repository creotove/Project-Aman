import { NextFunction, Response } from 'express';
import { Container } from 'typedi';
import { User } from '@interfaces/users.interface';
import { UserService } from '@services/users.service';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { JsonController, Get, Req } from 'routing-controllers';

@JsonController('/users')
export class UserController {
  public user = Container.get(UserService);

  @Get('/me')
  public async getUsers(@Req() req: RequestWithUser) {
    const users: User[] = await this.user.findById(req.user._id);
  }
}
