const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const items = [
    { name: 'HIKVISION 32CH NVR', price: 19500, unit: 'piece', category: 'NVR' },
    { name: 'HIKVISION 16CH NVR', price: 14500, unit: 'piece', category: 'NVR' },
    { name: 'HIKVISION 8CH NVR', price: 11500, unit: 'piece', category: 'NVR' },
    { name: 'HIKVISION 4CH NVR', price: 6500, unit: 'piece', category: 'NVR' },
    { name: 'HIKVISION 32CH DVR', price: 29500, unit: 'piece', category: 'DVR' },
    { name: 'HIKVISION 16CH DVR', price: 9800, unit: 'piece', category: 'DVR' },
    { name: 'HIKVISION 8CH DVR', price: 5300, unit: 'piece', category: 'DVR' },
    { name: 'HIKVISION 4CH DVR', price: 4300, unit: 'piece', category: 'DVR' },
    { name: 'PRAMA 4MP IP CAMERA', price: 5650, unit: 'piece', category: 'CAMERA' },
    { name: 'PRAMA 2MP IP CAMERA', price: 4450, unit: 'piece', category: 'CAMERA' },
    { name: 'HIKVISION 3K COLORVU CAMERA', price: 2850, unit: 'piece', category: 'CAMERA' },
    { name: 'HIKVISION 2MP COLORVU CAMERA', price: 2350, unit: 'piece', category: 'CAMERA' },
    { name: 'HIKVISION 5MP HD CAMERA', price: 1550, unit: 'piece', category: 'CAMERA' },
    { name: 'HIKVISION 2MP FULL HD CAMERA', price: 1350, unit: 'piece', category: 'CAMERA' },
    { name: 'HIKVISION 2MP HD CAMERA', price: 1150, unit: 'piece', category: 'CAMERA' },
    { name: '4TB HARD DISK', price: 12500, unit: 'piece', category: 'STORAGE' },
    { name: '2TB HARD DISK', price: 9200, unit: 'piece', category: 'STORAGE' },
    { name: '1TB HARD DISK', price: 8950, unit: 'piece', category: 'STORAGE' },
    { name: '500GB HARD DISK', price: 3600, unit: 'piece', category: 'STORAGE' },
    { name: '16CH POWER SUPPLY', price: 1800, unit: 'piece', category: 'POWER' },
    { name: '8CH POWER SUPPLY', price: 1000, unit: 'piece', category: 'POWER' },
    { name: '4CH POWER SUPPLY', price: 800, unit: 'piece', category: 'POWER' },
    { name: 'SERVER RACK', price: 1950, unit: 'piece', category: 'ACCESSORY' },
    { name: 'CAT6 CABLE', price: 30, unit: 'meter', category: 'CABLE' },
    { name: 'CAT6 CABLE WITH LAYING', price: 67, unit: 'meter', category: 'CABLE' },
    { name: 'CAT6 CABLE WITH PIPE', price: 72, unit: 'meter', category: 'CABLE' },
    { name: '3+1 CAMERA CABLE', price: 17, unit: 'meter', category: 'CABLE' },
    { name: '3+1 CAMERA CABLE WITH LAYING', price: 39, unit: 'meter', category: 'CABLE' },
    { name: '3+1 CAMERA CABLE WITH PIPE', price: 49, unit: 'meter', category: 'CABLE' },
    { name: 'INSTALLATION CHARGE', price: 500, unit: 'per_camera', category: 'SERVICE' },
    { name: 'BNC DC PINS BOX', price: 100, unit: 'piece', category: 'ACCESSORY' },
];

async function main() {
    console.log('Start seeding items catalog...');
    for (const item of items) {
        await prisma.itemsCatalog.upsert({
            where: { name: item.name },
            update: { price: item.price, unit: item.unit, category: item.category },
            create: item,
        });
    }
    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
