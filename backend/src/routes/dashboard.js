// One endpoint that returns summary numbers for the dashboard cards.
// Shows how to aggregate/compute instead of just listing rows.
import { Router } from 'express';
import prisma from '../prisma.js';
import { asyncHandler } from '../asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const [totalParts, totalSuppliers, totalCustomers, parts] = await Promise.all([
    prisma.part.count(),
    prisma.supplier.count(),
    prisma.customer.count(),
    prisma.part.findMany({ include: { supplier: true } }),
  ]);

  // Parts at or below their reorder level need restocking.
  const lowStock = parts.filter((p) => p.quantityInStock <= p.reorderLevel);

  // Total money tied up in inventory (cost basis), in ETB.
  const inventoryValue = parts.reduce(
    (sum, p) => sum + p.costPrice * p.quantityInStock,
    0
  );

  res.json({
    totalParts,
    totalSuppliers,
    totalCustomers,
    lowStockCount: lowStock.length,
    inventoryValue,
    lowStock: lowStock.map((p) => ({
      id: p.id,
      partNumber: p.partNumber,
      name: p.name,
      quantityInStock: p.quantityInStock,
      reorderLevel: p.reorderLevel,
      supplier: p.supplier?.name || '—',
    })),
  });
}));

export default router;
