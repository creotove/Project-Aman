import { Request } from 'express';

export interface DataStoredInToken {
  _id: string;
}

export interface TokenData {
  token: string;
  expiresIn: number;
}

export interface RequestWithUser extends Request {
  user: DataStoredInToken;
  file?: Express.Multer.File;
}
