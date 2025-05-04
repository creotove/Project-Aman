import { User as UserInterface } from '@/interfaces/users.interface';
import { Schema, model, Document } from 'mongoose';
import { UserRole } from '@/enums';
import bcryptjs from 'bcryptjs';
export type UserDocument = UserInterface & Document;

const UserSchema = new Schema<UserDocument>({
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
    index: true,
    unique: true,
  },
  avatar: {
    type: String,
    default: 'https://www.w3schools.com/howto/img_avatar.png',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  forgotPasswordToken: {
    type: String,
  },
  forgotPasswordTokenExpiry: {
    type: Date,
  },
  passwordResetOTP: {
    type: Number,
  },
});

// hash password
UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcryptjs.hash(this.password, 10);
  }
  next();
});

export const UserModel = model<UserDocument>('User', UserSchema);
