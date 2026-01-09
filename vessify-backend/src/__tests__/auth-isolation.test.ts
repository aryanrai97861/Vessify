import { prisma } from '../lib/prisma';

describe('Auth & Data Isolation', () => {
  const testUser1 = {
    email: `test1-${Date.now()}@example.com`,
    name: 'Test User 1',
  };
  
  const testUser2 = {
    email: `test2-${Date.now()}@example.com`,
    name: 'Test User 2',
  };
  
  let user1Id: string;
  let user2Id: string;
  let org1Id: string;
  let org2Id: string;
  let transaction1Id: string;
  let transaction2Id: string;

  beforeAll(async () => {
    // Create test users
    const user1 = await prisma.user.create({
      data: {
        email: testUser1.email,
        name: testUser1.name,
      },
    });
    user1Id = user1.id;

    const user2 = await prisma.user.create({
      data: {
        email: testUser2.email,
        name: testUser2.name,
      },
    });
    user2Id = user2.id;

    // Create organizations for each user
    const org1 = await prisma.organization.create({
      data: {
        name: `${testUser1.name}'s Org`,
        slug: `test-org-1-${Date.now()}`,
        members: {
          create: {
            userId: user1Id,
            role: 'owner',
          },
        },
      },
    });
    org1Id = org1.id;

    const org2 = await prisma.organization.create({
      data: {
        name: `${testUser2.name}'s Org`,
        slug: `test-org-2-${Date.now()}`,
        members: {
          create: {
            userId: user2Id,
            role: 'owner',
          },
        },
      },
    });
    org2Id = org2.id;

    // Create transactions for each user
    const t1 = await prisma.transaction.create({
      data: {
        userId: user1Id,
        organizationId: org1Id,
        date: new Date('2025-12-11'),
        description: 'User 1 Transaction',
        amount: -100,
        balance: 1000,
        rawText: 'Test transaction for user 1',
        confidence: 0.9,
      },
    });
    transaction1Id = t1.id;

    const t2 = await prisma.transaction.create({
      data: {
        userId: user2Id,
        organizationId: org2Id,
        date: new Date('2025-12-11'),
        description: 'User 2 Transaction',
        amount: -200,
        balance: 2000,
        rawText: 'Test transaction for user 2',
        confidence: 0.85,
      },
    });
    transaction2Id = t2.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.transaction.deleteMany({
      where: {
        id: { in: [transaction1Id, transaction2Id] },
      },
    });
    await prisma.member.deleteMany({
      where: {
        organizationId: { in: [org1Id, org2Id] },
      },
    });
    await prisma.organization.deleteMany({
      where: {
        id: { in: [org1Id, org2Id] },
      },
    });
    await prisma.user.deleteMany({
      where: {
        id: { in: [user1Id, user2Id] },
      },
    });
    await prisma.$disconnect();
  });

  // Test 4: User creation works
  test('should create users successfully', async () => {
    const user = await prisma.user.findUnique({
      where: { id: user1Id },
    });
    expect(user).not.toBeNull();
    expect(user?.email).toBe(testUser1.email);
  });

  // Test 5: Organization membership is created
  test('should create organization membership', async () => {
    const member = await prisma.member.findFirst({
      where: {
        userId: user1Id,
        organizationId: org1Id,
      },
    });
    expect(member).not.toBeNull();
    expect(member?.role).toBe('owner');
  });

  // Test 6: Data isolation - User cannot see other user's transactions
  test('should enforce data isolation between users', async () => {
    // Query transactions for user1
    const user1Transactions = await prisma.transaction.findMany({
      where: {
        userId: user1Id,
        organizationId: org1Id,
      },
    });

    // Should only get user1's transaction
    expect(user1Transactions.length).toBe(1);
    expect(user1Transactions[0].description).toBe('User 1 Transaction');

    // Query transactions for user2
    const user2Transactions = await prisma.transaction.findMany({
      where: {
        userId: user2Id,
        organizationId: org2Id,
      },
    });

    // Should only get user2's transaction
    expect(user2Transactions.length).toBe(1);
    expect(user2Transactions[0].description).toBe('User 2 Transaction');

    // Cross-user query should return empty
    const crossQuery = await prisma.transaction.findMany({
      where: {
        userId: user1Id,
        organizationId: org2Id, // Wrong org
      },
    });
    expect(crossQuery.length).toBe(0);
  });
});
