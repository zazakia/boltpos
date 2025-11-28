import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// IMPORTANT: This file acts as the server-side database client.
// Do NOT import this into your React Native components (screens, hooks, etc.).
// Use it ONLY in Expo API Routes (app/api/...) or other server-side scripts.
