import {
  ValidatorConstraint,
  ValidatorConstraintInterface
} from 'class-validator';

@ValidatorConstraint({ name: 'isUsernameValid', async: false })
export class IsUsernameValid implements ValidatorConstraintInterface {
  validate(username: string) {
    return /^[a-zA-Z0-9_.]*$/.test(username);
  }

  defaultMessage() {
    return 'Username can only contain uppercase and lowercase letters, digits, underscores and periods';
  }
}
