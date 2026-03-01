const prisma = require('../src/config/prisma');

async function main() {
    const products = [
        { name: 'HIKVISION 32CH NVR', category: 'NVR', purchasePrice: 19500, sellingPrice: 22000, unitType: 'piece' },
        { name: 'HIKVISION 16CH NVR', category: 'NVR', purchasePrice: 14500, sellingPrice: 16500, unitType: 'piece' },
        { name: 'HIKVISION 8CH NVR', category: 'NVR', purchasePrice: 11500, sellingPrice: 13000, unitType: 'piece' },
        { name: 'HIKVISION 4CH NVR', category: 'NVR', purchasePrice: 6500, sellingPrice: 7500, unitType: 'piece' },
        { name: 'HIKVISION 32CH DVR', category: 'DVR', purchasePrice: 29500, sellingPrice: 32000, unitType: 'piece' },
        { name: 'HIKVISION 16CH DVR', category: 'DVR', purchasePrice: 9800, sellingPrice: 11500, unitType: 'piece' },
        { name: 'HIKVISION 8CH DVR', category: 'DVR', purchasePrice: 5300, sellingPrice: 6500, unitType: 'piece' },
        { name: 'HIKVISION 4CH DVR', category: 'DVR', purchasePrice: 4300, sellingPrice: 5000, unitType: 'piece' },
        { name: 'PRAMA 4MP IP CAMERAS', category: 'Camera', purchasePrice: 5650, sellingPrice: 6500, unitType: 'piece' },
        { name: 'PRAMA 2MP IP CAMERAS', category: 'Camera', purchasePrice: 4450, sellingPrice: 5200, unitType: 'piece' },
        { name: 'HIKVISION 3K COLORVU CAMERAS', category: 'Camera', purchasePrice: 2850, sellingPrice: 3500, unitType: 'piece' },
        { name: 'HIKVISION 2MP COLORVU CAMERAS', category: 'Camera', purchasePrice: 2350, sellingPrice: 2800, unitType: 'piece' },
        { name: 'HIKVISION 5MP HD CAMERAS', category: 'Camera', purchasePrice: 1550, sellingPrice: 2000, unitType: 'piece' },
        { name: 'HIKVISION 2MP FULL HD CAMERAS', category: 'Camera', purchasePrice: 1350, sellingPrice: 1800, unitType: 'piece' },
        { name: 'HIKVISION 2MP HD CAMERAS', category: 'Camera', purchasePrice: 1150, sellingPrice: 1500, unitType: 'piece' },
        { name: '4TB HARD DISK (ORIGINAL)', category: 'Storage', purchasePrice: 12500, sellingPrice: 13500, unitType: 'piece' },
        { name: '2TB HARD DISK (ORIGINAL)', category: 'Storage', purchasePrice: 9200, sellingPrice: 10500, unitType: 'piece' },
        { name: '1TB HARD DISK (ORIGINAL)', category: 'Storage', purchasePrice: 8950, sellingPrice: 9800, unitType: 'piece' },
        { name: '500GB HARD DISK', category: 'Storage', purchasePrice: 3600, sellingPrice: 4200, unitType: 'piece' },
        { name: '16CH POWER SUPPLY', category: 'Power', purchasePrice: 1800, sellingPrice: 2200, unitType: 'piece' },
        { name: '8CH POWER SUPPLY', category: 'Power', purchasePrice: 1000, sellingPrice: 1300, unitType: 'piece' },
        { name: '4CH POWER SUPPLY', category: 'Power', purchasePrice: 800, sellingPrice: 1000, unitType: 'piece' },
        { name: 'BNC,DC PINS & BOXES', category: 'Connector', purchasePrice: 100, sellingPrice: 150, unitType: 'piece' },
        { name: 'SERVER RACK', category: 'Rack', purchasePrice: 1950, sellingPrice: 2500, unitType: 'piece' },
        { name: 'CAT 6 CABLE', category: 'Cable', purchasePrice: 30, sellingPrice: 45, unitType: 'meter' },
        { name: 'CAT 6 CABLE WITH LAYING CHARGES', category: 'Cable', purchasePrice: 67, sellingPrice: 85, unitType: 'meter' },
        { name: 'CAT 6 CABLE WITH LAYING CHARGES (INCLUDING PIPES)', category: 'Cable', purchasePrice: 72, sellingPrice: 95, unitType: 'meter' },
        { name: '3+1 CAMERA CABLE', category: 'Cable', purchasePrice: 17, sellingPrice: 25, unitType: 'meter' },
        { name: '3+1 CAMERA CABLE WITH LAYING CHARGES', category: 'Cable', purchasePrice: 39, sellingPrice: 55, unitType: 'meter' },
        { name: '3+1 CAMERA CABLE WITH LAYING CHARGES (INCLUDING PIPES)', category: 'Cable', purchasePrice: 49, sellingPrice: 65, unitType: 'meter' },
        { name: 'INSTALLATION CHARGES', category: 'Service', purchasePrice: 500, sellingPrice: 800, unitType: 'per_camera' }
    ];

    for (const product of products) {
        await prisma.productMaster.upsert({
            where: { id: 'some-id' }, // Placeholder, we'll use name if we can or just create
            update: {},
            create: {
                ...product,
                isActive: true,
                minimumStockAlert: 5
            },
        });
    }

    // To avoid duplicates and allow updating prices, we should ideally have a unique field like Name.
    // For now, let's just use create or a manual check by name.
    /*
    for (const product of products) {
      const existing = await prisma.productMaster.findFirst({ where: { name: product.name } });
      if (existing) {
        await prisma.productMaster.update({
          where: { id: existing.id },
          data: product
        });
      } else {
        await prisma.productMaster.create({ data: product });
      }
    }
    */

    console.log('Inventory seed data processed');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
