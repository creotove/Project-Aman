import { UserRole } from '@/enums';

export interface User {
  _id?: string;
  name: string;
  role: UserRole;
  password: string;
  phone: string;
}
