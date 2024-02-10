import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
        log: ['query'] //usado no desenvolvimento para ver as queries que estão sendo executadas
});
