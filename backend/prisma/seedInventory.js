const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const products = [
    { name: 'HIKVISION 32CH NVR', category: 'NVR', unitType: 'piece' },
    { name: 'HIKVISION 16CH NVR', category: 'NVR', unitType: 'piece' },
    { name: 'HIKVISION 8CH NVR', category: 'NVR', unitType: 'piece' },
    { name: 'HIKVISION 4CH NVR', category: 'NVR', unitType: 'piece' },
    { name: 'HIKVISION 32CH DVR', category: 'DVR', unitType: 'piece' },
    { name: 'HIKVISION 16CH DVR', category: 'DVR', unitType: 'piece' },
    { name: 'HIKVISION 8CH DVR', category: 'DVR', unitType: 'piece' },
    { name: 'HIKVISION 4CH DVR', category: 'DVR', unitType: 'piece' },
    { name: 'PRAMA 4MP IP CAMERAS', category: 'Camera', unitType: 'piece' },
    { name: 'PRAMA 2MP IP CAMERAS', category: 'Camera', unitType: 'piece' },
    { name: 'HIKVISION 3K COLORVU CAMERAS', category: 'Camera', unitType: 'piece' },
    { name: 'HIKVISION 2MP COLORVU CAMERAS', category: 'Camera', unitType: 'piece' },
    { name: 'HIKVISION 5MP HD CAMERAS', category: 'Camera', unitType: 'piece' },
    { name: 'HIKVISION 2MP FULL HD CAMERAS', category: 'Camera', unitType: 'piece' },
    { name: 'HIKVISION 2MP HD CAMERAS', category: 'Camera', unitType: 'piece' },
    { name: '4TB HARD DISK', category: 'Hard Disk', unitType: 'piece' },
    { name: '2TB HARD DISK', category: 'Hard Disk', unitType: 'piece' },
    { name: '1TB HARD DISK', category: 'Hard Disk', unitType: 'piece' },
    { name: '500GB HARD DISK', category: 'Hard Disk', unitType: 'piece' },
    { name: '16CH POWER SUPPLY', category: 'Power Supply', unitType: 'piece' },
    { name: '8CH POWER SUPPLY', category: 'Power Supply', unitType: 'piece' },
    { name: '4CH POWER SUPPLY', category: 'Power Supply', unitType: 'piece' },
    { name: 'BNC DC PINS BOX', category: 'Accessories', unitType: 'piece' },
    { name: 'SERVER RACK', category: 'Rack', unitType: 'piece' },
    { name: 'CAT6 CABLE', category: 'Cable', unitType: 'meter' },
    { name: 'CAT6 CABLE WITH LAYING', category: 'Cable', unitType: 'meter' },
    { name: 'CAT6 CABLE WITH PIPE', category: 'Cable', unitType: 'meter' },
    { name: '3+1 CAMERA CABLE', category: 'Cable', unitType: 'meter' },
    { name: '3+1 CAMERA CABLE WITH LAYING', category: 'Cable', unitType: 'meter' },
    { name: '3+1 CAMERA CABLE WITH PIPE', category: 'Cable', unitType: 'meter' },
    { name: 'INSTALLATION CHARGES', category: 'Service', unitType: 'piece' }
];

async function main() {
    console.log('Seeding products...');
    for (const prod of products) {
        await prisma.productMaster.upsert({
            where: { id: prod.name }, // This won't work because use name, let's use name check
            update: {},
            create: {
                name: prod.name,
                category: prod.category,
                unitType: prod.unitType,
                sellingPrice: 0 // Prices not stored as per requirement
            }
        }).catch(async (e) => {
            // If ID is not the name, we should find by name first
            const existing = await prisma.productMaster.findFirst({ where: { name: prod.name } });
            if (!existing) {
                await prisma.productMaster.create({
                    data: {
                        name: prod.name,
                        category: prod.category,
                        unitType: prod.unitType,
                        sellingPrice: 0
                    }
                });
            }
        });
    }
    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
