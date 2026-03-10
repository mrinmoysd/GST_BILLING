import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

// Accepts either a JS number or a string that can be losslessly converted to a number.
// We use strings for money/qty inputs to avoid float issues on the client.
export function IsDecimalStringSafe(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'isDecimalStringSafe',
      target: object.constructor,
      propertyName: String(propertyName),
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value === 'number') return Number.isFinite(value);
          if (typeof value !== 'string') return false;
          const trimmed = value.trim();
          if (!trimmed) return false;
          // allow negative and decimals
          if (!/^[-+]?\d+(\.\d+)?$/.test(trimmed)) return false;
          const n = Number(trimmed);
          return Number.isFinite(n);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a decimal string`;
        },
      },
    });
  };
}
