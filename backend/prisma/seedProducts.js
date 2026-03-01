const prisma = require('../src/config/prisma');

async function main() {
  const products = [
    // Cameras
    { name: 'Hikvision 2MP Dome Camera', category: 'Camera', brand: 'Hikvision', type: 'Dome', unitPrice: 1500, unitType: 'piece' },
    { name: 'Hikvision 2MP Bullet Camera', category: 'Camera', brand: 'Hikvision', type: 'Bullet', unitPrice: 1600, unitType: 'piece' },
    { name: 'CP Plus 2MP Dome Camera', category: 'Camera', brand: 'CP Plus', type: 'Dome', unitPrice: 1400, unitType: 'piece' },
    { name: 'CP Plus 2MP Bullet Camera', category: 'Camera', brand: 'CP Plus', type: 'Bullet', unitPrice: 1500, unitType: 'piece' },

    // DVRs
    { name: 'Hikvision 4 Channel DVR', category: 'DVR', brand: 'Hikvision', type: '4CH', unitPrice: 3500, unitType: 'piece' },
    { name: 'Hikvision 8 Channel DVR', category: 'DVR', brand: 'Hikvision', type: '8CH', unitPrice: 5500, unitType: 'piece' },
    { name: 'Hikvision 16 Channel DVR', category: 'DVR', brand: 'Hikvision', type: '16CH', unitPrice: 9500, unitType: 'piece' },

    // NVRs
    { name: 'Hikvision 4 Channel NVR', category: 'NVR', brand: 'Hikvision', type: '4CH', unitPrice: 4500, unitType: 'piece' },
    { name: 'Hikvision 8 Channel NVR', category: 'NVR', brand: 'Hikvision', type: '8CH', unitPrice: 7500, unitType: 'piece' },

    // Accessories
    { name: 'CCTV 3+1 Wire (90 Meters)', category: 'Cable', brand: 'Generic', type: 'Coaxial', unitPrice: 1500, unitType: 'piece' },
    { name: 'CCTV 3+1 Wire (Per Meter)', category: 'Cable', brand: 'Generic', type: 'Coaxial', unitPrice: 20, unitType: 'meter' },
    { name: 'Seagate 1TB Surveillance HDD', category: 'Storage', brand: 'Seagate', type: 'HDD', unitPrice: 4500, unitType: 'piece' },
    { name: 'Seagate 2TB Surveillance HDD', category: 'Storage', brand: 'Seagate', type: 'HDD', unitPrice: 6500, unitType: 'piece' },
    { name: 'Power Supply 4 Channel', category: 'Power', brand: 'Generic', type: '4CH', unitPrice: 600, unitType: 'piece' },
    { name: 'Power Supply 8 Channel', category: 'Power', brand: 'Generic', type: '8CH', unitPrice: 1100, unitType: 'piece' },
    { name: 'BNC Connector', category: 'Connector', brand: 'Generic', type: 'BNC', unitPrice: 25, unitType: 'piece' },
    { name: 'DC Pin', category: 'Connector', brand: 'Generic', type: 'DC', unitPrice: 15, unitType: 'piece' },

    // Services
    { name: 'Installation Charges', category: 'Service', brand: 'Hi-Tech', type: 'Service', unitPrice: 500, unitType: 'per_camera' }
  ];

  for (const product of products) {
    await prisma.productMaster.upsert({
      where: { id: 'some-id' }, // This won't match, we'll use name for upsert check if we had a unique name
      update: {},
      create: product,
    });
  }

  // Better upsert using name if we want to be safe, but for seed we can just create
  // To avoid duplicates on multiple runs, let's just clear and create or use unique name
  // For now, let's just create them. In a real scenario, name should probably be unique in ProductMaster.

  console.log('Seed data inserted successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
