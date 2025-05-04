import { Service } from 'typedi';
import { BaseService } from './base.service';
import { UserModel, UserDocument } from '@/models/users.model';

@Service()
export class UserService extends BaseService<UserDocument> {
  constructor() {
    super(UserModel);
  }
}
