import { ExpressErrorMiddlewareInterface, Middleware } from 'routing-controllers';
import * as mongoose from 'mongoose';
import { logger } from '@utils/logger';

@Middleware({ type: 'after' })
export class HttpErrorHandler implements ExpressErrorMiddlewareInterface {
  error(error: any, request: any, response: any, next: (err: any) => any) {
    logger.error(`[${request.method}] ${request.path} >> StatusCode:: ${error.statusCode || error.status}, Message:: ${error?.message}`);
    if (error instanceof mongoose.Error.ValidationError) {
      return response.status(422).json({ message: error.message });
    }
    if (error instanceof mongoose.Error.CastError) {
      return response.status(422).json({ message: 'Invalid ID format' });
    }
    if (error instanceof mongoose.Error) {
      return response.status(422).json({ message: error.message });
    }
    if (error.statusCode) {
      return response.status(error.statusCode).json({ message: error.message });
    }
    if (error.status) {
      return response.status(error.status).json({ message: error.message });
    }
    if (error instanceof Error) {
      return response.status(500).json({ message: error.message });
    }
    next(error);
  }
}
