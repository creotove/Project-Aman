import { Container } from 'typedi';
import { RequestWithUser } from '@interfaces/auth.interface';
import { AuthService } from '@services/auth.service';
import { Body, JsonController, Post, Req, UseBefore } from 'routing-controllers';
import { CreateUserDto, LoginUserDto } from '@/dtos/users.dto';
import { ApiResponse, StatusCode } from '@/utils/ApiResponse';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';
import passport from 'passport';

@JsonController('/auth')
export class AuthController {
  public auth = Container.get(AuthService);

  @Post('/register')
  @UseBefore(ValidationMiddleware(CreateUserDto))
  public async signUp(@Body() user: CreateUserDto) {
    const { token, user: newUser } = await this.auth.signup(user);
    return new ApiResponse(StatusCode.Created, { token, user: newUser }, 'Registered Successful!');
  }

  @Post('/login')
  @UseBefore(ValidationMiddleware(LoginUserDto))
  public async logIn(@Body() data: LoginUserDto) {
    const { token, user } = await this.auth.login(data);
    return new ApiResponse(StatusCode.OK, { token, user }, 'Logged in Successful!');
  }

  @Post('/logout')
  @UseBefore(passport.authenticate('jwt', { session: false, failWithError: true }))
  public async logOut(@Req() req: RequestWithUser) {
    await this.auth.logout(req);
    return new ApiResponse(StatusCode.OK, null, 'Logout successful');
  }
}
