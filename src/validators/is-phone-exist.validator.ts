import { registerDecorator, ValidationOptions } from 'class-validator';
import { UserModel } from '@/models/users.model';

export function IsPhoneAlreadyExist(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: {
        async validate(phone: string) {
          const user = await UserModel.findOne({ phone });
          return !user;
        },
        defaultMessage() {
          return `Phone number already exists.`;
        },
      },
    });
  };
}
