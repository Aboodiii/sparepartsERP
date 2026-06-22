// Run with: npm run db:seed
// Fills the empty database with realistic sample data so the UI isn't blank.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Start clean so re-seeding doesn't pile up duplicates.
  await prisma.part.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.customer.deleteMany();

  const guangzhou = await prisma.supplier.create({
    data: { name: 'Guangzhou Auto Parts Co.', country: 'China', contactPerson: 'Li Wei', phone: '+86 20 1234 5678', email: 'sales@gzautoparts.cn' },
  });
  const dubai = await prisma.supplier.create({
    data: { name: 'Al Madina Trading LLC', country: 'UAE', contactPerson: 'Omar Hassan', phone: '+971 4 555 1212', email: 'info@almadina.ae' },
  });
  const japan = await prisma.supplier.create({
    data: { name: 'Nippon Genuine Parts', country: 'Japan', contactPerson: 'Tanaka Hiro', phone: '+81 3 9876 5432', email: 'export@nipponparts.jp' },
  });

  await prisma.part.createMany({
    data: [
      { partNumber: 'TY-90915-YZZD2', name: 'Oil Filter', brand: 'Toyota', category: 'Filters', vehicleMake: 'Toyota', costPrice: 180, sellingPrice: 320, quantityInStock: 120, reorderLevel: 20, supplierId: japan.id },
      { partNumber: 'TY-04465-0K090', name: 'Brake Pad Set (Front)', brand: 'Advics', category: 'Brakes', vehicleMake: 'Toyota', costPrice: 950, sellingPrice: 1650, quantityInStock: 8, reorderLevel: 10, supplierId: japan.id },
      { partNumber: 'IS-8-97603-263', name: 'Fuel Filter', brand: 'Isuzu', category: 'Filters', vehicleMake: 'Isuzu', costPrice: 420, sellingPrice: 780, quantityInStock: 45, reorderLevel: 15, supplierId: guangzhou.id },
      { partNumber: 'HY-26300-35503', name: 'Oil Filter', brand: 'Hyundai', category: 'Filters', vehicleMake: 'Hyundai', costPrice: 160, sellingPrice: 300, quantityInStock: 3, reorderLevel: 20, supplierId: dubai.id },
      { partNumber: 'UNI-12V-55AH', name: 'Battery 12V 55Ah', brand: 'Amaron', category: 'Electrical', vehicleMake: 'Universal', costPrice: 3200, sellingPrice: 4800, quantityInStock: 22, reorderLevel: 8, supplierId: dubai.id },
      { partNumber: 'TY-17801-21050', name: 'Air Filter', brand: 'Toyota', category: 'Filters', vehicleMake: 'Toyota', costPrice: 240, sellingPrice: 450, quantityInStock: 60, reorderLevel: 15, supplierId: guangzhou.id },
    ],
  });

  await prisma.customer.createMany({
    data: [
      { name: 'Bole Auto Garage', type: 'Garage', phone: '+251 91 111 2222', address: 'Bole, Addis Ababa' },
      { name: 'Merkato Spare Parts Retail', type: 'Retail', phone: '+251 92 333 4444', address: 'Merkato, Addis Ababa' },
      { name: 'Habesha Transport PLC', type: 'Wholesale', phone: '+251 93 555 6666', email: 'fleet@habeshatransport.et', address: 'Kality, Addis Ababa' },
    ],
  });

  console.log('Seed complete: 3 suppliers, 6 parts, 3 customers.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
