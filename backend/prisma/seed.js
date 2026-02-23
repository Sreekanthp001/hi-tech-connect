const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    const adminPassword = await bcrypt.hash('admin123', 10);
    const workerPassword = await bcrypt.hash('worker123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@hitech.com' },
        update: {},
        create: {
            email: 'admin@hitech.com',
            name: 'System Admin',
            password: adminPassword,
            role: 'ADMIN',
        },
    });

    const worker = await prisma.user.upsert({
        where: { email: 'worker@hitech.com' },
        update: {},
        create: {
            email: 'worker@hitech.com',
            name: 'Service Worker',
            password: workerPassword,
            role: 'WORKER',
        },
    });

    console.log({ admin, worker });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
