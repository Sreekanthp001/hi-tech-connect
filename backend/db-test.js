const prisma = require('./src/config/prisma');

async function testConnection() {
    try {
        await prisma.$connect();
        console.log('✅ Database connection successful');
        const userCount = await prisma.user.count();
        console.log(`📊 Current user count: ${userCount}`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Database connection failed');
        console.error(error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testConnection();
