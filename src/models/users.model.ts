import { User as UserInterface } from '@/interfaces/users.interface';
import { Schema, model, Document } from 'mongoose';
import { UserRole } from '@/enums';
import bcryptjs from 'bcryptjs';
export type UserDocument = UserInterface & Document;

const UserSchema = new Schema<UserDocument>({
  name: { type: String, required: true },
  role: { type: String, enum: Object.values(UserRole), required: true },
  password: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
});

// hash password
UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcryptjs.hash(this.password, 10);
  }
  next();
});

export const UserModel = model<UserDocument>('User', UserSchema);
