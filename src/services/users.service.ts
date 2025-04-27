import { BaseService } from './base.service';
import { UserModel, UserDocument } from '@/models/users.model';

export class UserService extends BaseService<UserDocument> {
  constructor() {
    super(UserModel);
  }

  async findActiveUsers() {
    return this.findAll();
  }
}
