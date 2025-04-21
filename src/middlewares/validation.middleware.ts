import { plainToInstance } from 'class-transformer';
import { validateOrReject, ValidationError } from 'class-validator';
import { NextFunction, Request, Response } from 'express';
import { HttpException } from '@exceptions/HttpException';

function extractValidationMessages(errors: ValidationError[], parentPath = ''): string[] {
  const messages: string[] = [];

  for (const error of errors) {
    const currentPath = parentPath ? `${parentPath}.${error.property}` : error.property;

    if (error.constraints) {
      for (const key in error.constraints) {
        const constraint = error.constraints[key];
        if (key === 'unknownValue' || !constraint) {
          messages.push(`${parentPath}: contains forbidden or invalid value`);
        } else {
          messages.push(`${currentPath}: ${constraint}`);
        }
      }
    }

    if (error.children && error.children.length > 0) {
      const childMessages = extractValidationMessages(error.children, currentPath);
      messages.push(...childMessages);
    }
  }

  return messages;
}

/**
 * @name ValidationMiddleware
 * @description Allows use of decorator and non-decorator based validation
 * @param type dto
 * @param skipMissingProperties When skipping missing properties
 * @param whitelist Even if your object is an instance of a validation class it can contain additional properties that are not defined
 * @param forbidNonWhitelisted If you would rather to have an error thrown when any non-whitelisted properties are present
 */
export const ValidationMiddleware = (type: any, skipMissingProperties = false, whitelist = true, forbidNonWhitelisted = true) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const isArray = Array.isArray(req.body);
      const dto = plainToInstance(type, req.body);

      if (isArray) {
        await Promise.all((dto as object[]).map(item => validateOrReject(item, { skipMissingProperties, whitelist, forbidNonWhitelisted })));
      } else {
        await validateOrReject(dto as object, {
          skipMissingProperties,
          whitelist,
          forbidNonWhitelisted,
        });
      }

      req.body = dto;
      next();
    } catch (errors) {
      const allErrors: ValidationError[] = Array.isArray(errors) ? errors.flat() : [errors];
      const message = extractValidationMessages(allErrors).join(', ');
      next(new HttpException(400, message || 'Validation failed'));
    }
  };
};
