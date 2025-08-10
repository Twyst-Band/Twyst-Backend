import { Pool } from 'pg';
import envConfig from '../env.config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { users } from '../src/database/schema/users';
import { follows } from '../src/database/schema/follows';
import { bodyProfiles } from '../src/database/schema/body-profiles';
import { BcryptUtils } from '../src/common/utils/bcrypt.utils';
import { eq } from 'drizzle-orm';

async function seed() {
  const pool = new Pool({ connectionString: envConfig.DB_URL });
  const db: NodePgDatabase = drizzle({ client: pool });

  // Cleanup
  await db.delete(follows);
  await db.delete(bodyProfiles);
  await db.delete(users);

  const passwordHash = await BcryptUtils.hashPassword('Test123!');

  const [alice] = await db
    .insert(users)
    .values({ email: 'alice@example.com', password: passwordHash, firstName: 'Alice', lastName: 'Anderson', userName: 'alice' })
    .returning({ id: users.id });
  const [bob] = await db
    .insert(users)
    .values({ email: 'bob@example.com', password: passwordHash, firstName: 'Bob', lastName: 'Brown', userName: 'bob' })
    .returning({ id: users.id });
  const [charlie] = await db
    .insert(users)
    .values({ email: 'charlie@example.com', password: passwordHash, firstName: 'Charlie', lastName: 'Clark', userName: 'charlie' })
    .returning({ id: users.id });

  // Follows: alice -> bob, bob -> charlie
  await db.insert(follows).values([
    { followerID: alice.id, followeeID: bob.id },
    { followerID: bob.id, followeeID: charlie.id },
  ]);

  // Body profiles for alice and bob
  await db.insert(bodyProfiles).values([
    {
      name: 'Alice Manual',
      userID: alice.id,
      addedManually: true,
      detectionDump: null,
      leftLowerArm: 20,
      rightLowerArm: 20,
      leftUpperArm: 30,
      rightUpperArm: 30,
      leftLowerLeg: 40,
      rightLowerLeg: 40,
      leftUpperLeg: 50,
      rightUpperLeg: 50,
      leftTorso: 25,
      rightTorso: 25,
      hip: 90,
      shoulders: 45,
    },
    {
      name: 'Bob Auto',
      userID: bob.id,
      addedManually: false,
      detectionDump: { source: 'test' },
      leftLowerArm: 21,
      rightLowerArm: 21,
      leftUpperArm: 31,
      rightUpperArm: 31,
      leftLowerLeg: 41,
      rightLowerLeg: 41,
      leftUpperLeg: 51,
      rightUpperLeg: 51,
      leftTorso: 26,
      rightTorso: 26,
      hip: 91,
      shoulders: 46,
    },
  ]);

  await pool.end();
}

void seed();

