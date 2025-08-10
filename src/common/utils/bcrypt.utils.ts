import { compare, genSalt, hash } from 'bcrypt';

export class BcryptUtils {
  private static salt_rounds: number = 10;

  static async hashPassword(password: string): Promise<string> {
    const salt = await genSalt(this.salt_rounds);

    return await hash(password, salt);
  }

  static async comparePasswords(
    incoming: string,
    original: string
  ): Promise<boolean> {
    return compare(incoming, original);
  }
}
