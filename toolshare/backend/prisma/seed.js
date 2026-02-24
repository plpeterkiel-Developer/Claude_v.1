/**
 * Seed script — populates the database with test data for development.
 * Run with: npx prisma db seed
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.warn('Seeding database...');

  // Create test users
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      name: 'Alice Hansen',
      email: 'alice@example.com',
      passwordHash,
      authProvider: 'local',
      emailVerified: true,
      preferredLanguage: 'da',
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      name: 'Bob Nielsen',
      email: 'bob@example.com',
      passwordHash,
      authProvider: 'local',
      emailVerified: true,
      preferredLanguage: 'en',
    },
  });

  const carol = await prisma.user.upsert({
    where: { email: 'carol@example.com' },
    update: {},
    create: {
      name: 'Carol Sørensen',
      email: 'carol@example.com',
      passwordHash,
      authProvider: 'local',
      emailVerified: false,
      preferredLanguage: 'da',
    },
  });

  // Create test tools
  await prisma.tool.upsert({
    where: { id: 'tool-lawnmower-1' },
    update: {},
    create: {
      id: 'tool-lawnmower-1',
      ownerId: alice.id,
      name: 'Lawnmower',
      description: 'Electric lawnmower, works great. Suitable for medium-sized gardens.',
      condition: 'good',
      status: 'available',
      pickupPointAddress: '14 Elm Street, Copenhagen 2100',
      pickupPointNote: 'Front gate — ring the bell',
    },
  });

  await prisma.tool.upsert({
    where: { id: 'tool-spade-1' },
    update: {},
    create: {
      id: 'tool-spade-1',
      ownerId: alice.id,
      name: 'Garden Spade',
      description: 'Heavy-duty steel spade. Some surface rust but fully functional.',
      condition: 'fair',
      status: 'available',
      pickupPointAddress: '14 Elm Street, Copenhagen 2100',
      pickupPointNote: 'Leaning against the garage door',
    },
  });

  await prisma.tool.upsert({
    where: { id: 'tool-hosepipe-1' },
    update: {},
    create: {
      id: 'tool-hosepipe-1',
      ownerId: bob.id,
      name: 'Hosepipe (25m)',
      description: '25-metre garden hosepipe with adjustable spray nozzle.',
      condition: 'good',
      status: 'available',
      pickupPointAddress: '7 Oak Avenue, Copenhagen 2200',
      pickupPointNote: 'Coiled in the porch',
    },
  });

  console.warn('Seeding complete.');
  console.warn(`Created users: ${alice.email}, ${bob.email}, ${carol.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
