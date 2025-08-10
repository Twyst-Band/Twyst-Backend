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
    return 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character';
  }
}
