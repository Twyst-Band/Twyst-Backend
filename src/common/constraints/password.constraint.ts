import {
  ValidatorConstraint,
  ValidatorConstraintInterface
} from 'class-validator';

@ValidatorConstraint({ name: 'isPasswordStrong', async: false })
export class IsPasswordStrong implements ValidatorConstraintInterface {
  validate(password: string) {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialCharacter = /[!@#$%^&*(),.?":{}|<>\[\]~`]/.test(password);

    return hasUpperCase && hasLowerCase && hasNumber && hasSpecialCharacter;
  }

  defaultMessage() {
    return 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character';
  }
}
