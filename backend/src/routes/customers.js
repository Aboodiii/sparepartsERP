import { Router } from 'express';
import prisma from '../prisma.js';
import { asyncHandler } from '../asyncHandler.js';

const router = Router();

const parseBody = (b) => ({
  name: b.name,
  type: b.type || 'Retail',
  phone: b.phone || null,
  email: b.email || null,
  address: b.address || null,
});

router.get('/', asyncHandler(async (req, res) => {
  const customers = await prisma.customer.findMany({ orderBy: { id: 'desc' } });
  res.json(customers);
}));

router.post('/', asyncHandler(async (req, res) => {
  const customer = await prisma.customer.create({ data: parseBody(req.body) });
  res.status(201).json(customer);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const customer = await prisma.customer.update({
    where: { id: Number(req.params.id) },
    data: parseBody(req.body),
  });
  res.json(customer);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await prisma.customer.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
}));

export default router;
