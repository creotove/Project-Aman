import { compare } from 'bcryptjs';
import { Service } from 'typedi';
import { CreateUserDto, LoginUserDto } from '@dtos/users.dto';
import { BaseService } from './base.service';
import JwtService from './jwt.service';
import { BadRequestError, UnauthorizedError } from '@/utils/ApiError';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { UserDocument, UserModel } from '@/models/users.model';

@Service()
export class AuthService extends BaseService<UserDocument> {
  constructor() {
    super(UserModel);
  }

  public async signup(userData: CreateUserDto): Promise<{ token: string; user: UserDocument }> {
    await this.create(userData);
    const newUser = await this.findOne({ email: userData.phone });
    newUser.password = undefined;
    const token = JwtService.jwtSign({ id: newUser._id, role: newUser.role });
    return { token, user: newUser };
  }

  public async login(userData: LoginUserDto): Promise<{ token: string; user: UserDocument }> {
    const user: UserDocument = await this.findOne({ phone: userData.phone });
    const isPasswordMatching: boolean = await compare(userData.password, user.password);
    if (!isPasswordMatching) throw new UnauthorizedError();
    user.password = undefined;
    const token = JwtService.jwtSign({ id: user._id, role: user.role });
    return { token, user };
  }

  public async logout(req: RequestWithUser) {
    const user = await this.findById(req.user._id);
    if (!user) throw new BadRequestError('User does not exist');
    JwtService.jwtBlacklistToken(JwtService.jwtGetToken(req));
  }
}
