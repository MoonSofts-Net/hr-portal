import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { hasValidCpfLength, normalizeCpf } from '../utils/cpf.util';

export function IsValidCpf(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidCpf',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && hasValidCpfLength(value);
        },
        defaultMessage(args: ValidationArguments) {
          const value = args.value;
          if (typeof value !== 'string' || normalizeCpf(value).length !== 11) {
            return 'CPF must have 11 digits';
          }
          return 'CPF must have 11 digits';
        },
      },
    });
  };
}
