import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

declare global {
    var prisma: undefined | PrismaClient;
}

// Lazy initialization - only create client when actually used
let prismaClient: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
    if (prismaClient) return prismaClient;

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL is not defined. Please set it in your environment variables.');
    }

    const pool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    prismaClient = new PrismaClient({ adapter });

    if (process.env.NODE_ENV !== 'production') {
        globalThis.prisma = prismaClient;
    }

    return prismaClient;
}

// Use globalThis to persist client across hot reloads in development
if (globalThis.prisma) {
    prismaClient = globalThis.prisma;
}

// Proxy that lazily initializes the client
const prisma = new Proxy({} as PrismaClient, {
    get(_, prop) {
        const client = getPrismaClient();
        return (client as any)[prop];
    }
});

export default prisma;
