// One shared Prisma client for the whole app (don't create it per request).
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
