import { faker } from '@faker-js/faker';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { users } from '@schema/users';
import * as bcrypt from 'bcrypt';

export async function seedUsers(
  db: NodePgDatabase<any>,
  count: number = 50
): Promise<void> {
  console.log(`\n🌱 Seeding ${count} users...`);

  const usersToInsert: (typeof users.$inferInsert)[] = [];
  const passwordHash = await bcrypt.hash('Test123!', 10);

  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const userName = faker.internet
      .username({ firstName, lastName })
      .toLowerCase();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();

    usersToInsert.push({
      firstName,
      lastName,
      userName,
      email,
      password: passwordHash,
      emailVerified: faker.datatype.boolean(0.7)
    });
  }

  try {
    await db.insert(users).values(usersToInsert);
    console.log(`✅ Successfully seeded ${count} users`);
  } catch (error: any) {
    if (error?.code === '23505') {
      console.log('⚠️  Some users already exist, skipping duplicates...');
      let inserted = 0;
      for (const user of usersToInsert) {
        try {
          await db.insert(users).values(user);
          inserted++;
        } catch (e: any) {
          if (e?.code !== '23505') {
            throw e;
          }
        }
      }
      console.log(`✅ Successfully inserted ${inserted} new users`);
    } else {
      throw error;
    }
  }
}
