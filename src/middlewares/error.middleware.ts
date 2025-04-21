import { NextFunction, Response } from 'express';
import { HttpException } from '@/exceptions/HttpException';
import { logger } from '@utils/logger';
import { RequestWithUser } from '@/interfaces/auth.interface';

export const ErrorMiddleware = (error: HttpException, req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const status: number = error.status || 500;
    const message: string = error.message || 'Something went wrong';
    logger.error(`[${req.method}] ${req.path} >> StatusCode:: ${status}, Message:: ${message}`);
    res.status(status).json({ message });
  } catch (error) {
    next(error);
  }
};
