import { compare, genSalt, hash } from 'bcrypt';

export class EncryptionUtils {
  private static saltRounds: number = 10;

  static async hashPassword(password: string): Promise<string> {
    const salt = await genSalt(this.saltRounds);

    return hash(password, salt);
  }

  static async comparePasswords(
    incoming: string,
    original: string
  ): Promise<boolean> {
    return compare(incoming, original);
  }
}
