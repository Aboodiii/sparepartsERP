// CRUD = Create, Read, Update, Delete. This is the pattern every resource
// follows. Read this file once and the others will feel familiar.
import { Router } from 'express';
import prisma from '../prisma.js';
import { asyncHandler } from '../asyncHandler.js';

const router = Router();

// Turn incoming JSON strings into the right types for the DB.
function parsePartBody(body) {
  return {
    partNumber: body.partNumber,
    name: body.name,
    brand: body.brand || null,
    category: body.category || null,
    vehicleMake: body.vehicleMake || null,
    unit: body.unit || 'pcs',
    costPrice: Number(body.costPrice) || 0,
    sellingPrice: Number(body.sellingPrice) || 0,
    quantityInStock: parseInt(body.quantityInStock) || 0,
    reorderLevel: parseInt(body.reorderLevel) || 0,
    supplierId: body.supplierId ? Number(body.supplierId) : null,
  };
}

// READ all
router.get('/', asyncHandler(async (req, res) => {
  const parts = await prisma.part.findMany({
    include: { supplier: true },
    orderBy: { id: 'desc' },
  });
  res.json(parts);
}));

// READ one
router.get('/:id', asyncHandler(async (req, res) => {
  const part = await prisma.part.findUnique({
    where: { id: Number(req.params.id) },
    include: { supplier: true },
  });
  if (!part) return res.status(404).json({ error: 'Part not found' });
  res.json(part);
}));

// CREATE
router.post('/', asyncHandler(async (req, res) => {
  const part = await prisma.part.create({ data: parsePartBody(req.body) });
  res.status(201).json(part);
}));

// UPDATE
router.put('/:id', asyncHandler(async (req, res) => {
  const part = await prisma.part.update({
    where: { id: Number(req.params.id) },
    data: parsePartBody(req.body),
  });
  res.json(part);
}));

// DELETE
router.delete('/:id', asyncHandler(async (req, res) => {
  await prisma.part.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
}));

export default router;
