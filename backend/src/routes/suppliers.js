import { Router } from 'express';
import prisma from '../prisma.js';
import { asyncHandler } from '../asyncHandler.js';

const router = Router();

const parseBody = (b) => ({
  name: b.name,
  country: b.country,
  contactPerson: b.contactPerson || null,
  phone: b.phone || null,
  email: b.email || null,
});

router.get('/', asyncHandler(async (req, res) => {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { id: 'desc' },
    include: { _count: { select: { parts: true } } }, // how many parts each supplies
  });
  res.json(suppliers);
}));

router.post('/', asyncHandler(async (req, res) => {
  const supplier = await prisma.supplier.create({ data: parseBody(req.body) });
  res.status(201).json(supplier);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const supplier = await prisma.supplier.update({
    where: { id: Number(req.params.id) },
    data: parseBody(req.body),
  });
  res.json(supplier);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await prisma.supplier.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
}));

export default router;
