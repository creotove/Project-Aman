import { Container } from 'typedi';
import { UserService } from '@services/users.service';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { JsonController, Get, Req, UseBefore } from 'routing-controllers';
import passport from 'passport';

@JsonController('/users')
export class UserController {
  public user = Container.get(UserService);

  @Get('/me')
  @UseBefore(passport.authenticate('jwt', { session: false, failWithError: true }))
  public async getUsers(@Req() req: RequestWithUser) {
    const user = await this.user.findById(req.user._id);
    return user;
  }
}
