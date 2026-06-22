import { Router } from 'express';
import prisma from '../prisma.js';
import { asyncHandler } from '../asyncHandler.js';

const router = Router();

// Function to calculate computed costs and taxes for a shipment
async function getCalculatedShipment(id) {
  const shipment = await prisma.shipment.findUnique({
    where: { id: Number(id) },
    include: {
      proforma: {
        include: { supplier: true }
      },
      items: true
    }
  });

  if (!shipment) return null;

  const exchangeRate = shipment.proforma.exchangeRate || 1.0;

  // 1. Calculate FOB (USD)
  let totalFOBUSD = 0;
  shipment.items.forEach(item => {
    totalFOBUSD += item.quantityReceived * item.unitCostUSD;
  });

  // 2. Shipping Costs (USD)
  const freightUSD = shipment.freightCostUSD || 0;
  const insuranceUSD = shipment.insuranceCostUSD || 0;

  // 3. CIF (USD and ETB)
  const cifUSD = totalFOBUSD + freightUSD + insuranceUSD;
  const cifETB = cifUSD * exchangeRate;

  // 4. Taxes (ETB)
  const dutyRate = shipment.importDutyRate || 0;
  const exciseRate = shipment.exciseTaxRate || 0;

  const importDutyETB = cifETB * (dutyRate / 100);
  const exciseTaxETB = (cifETB + importDutyETB) * (exciseRate / 100);
  const vatETB = (cifETB + importDutyETB + exciseTaxETB) * 0.15; // 15% fixed VAT
  const surtaxETB = (cifETB + importDutyETB + exciseTaxETB + vatETB) * 0.10; // 10% fixed Surtax
  const withholdingETB = cifETB * 0.03; // 3% fixed withholding tax

  const totalTaxesETB = importDutyETB + exciseTaxETB + vatETB + surtaxETB + withholdingETB;

  // 5. Local Costs (ETB)
  const portHandlingETB = shipment.portHandlingETB || 0;
  const clearingAgentETB = shipment.clearingAgentETB || 0;
  const inlandTransportETB = shipment.inlandTransportETB || 0;
  const brokerageETB = shipment.brokerageETB || 0;
  const otherChargesETB = shipment.otherChargesETB || 0;

  const totalLocalCostsETB = portHandlingETB + clearingAgentETB + inlandTransportETB + brokerageETB + otherChargesETB;

  // 6. Total Landed Cost (ETB)
  const totalLandedCostETB = cifETB + totalTaxesETB + totalLocalCostsETB;

  // Allocate Landed Cost to individual items
  const itemsWithLandedCost = shipment.items.map(item => {
    const itemFOBUSD = item.quantityReceived * item.unitCostUSD;
    const ratio = totalFOBUSD > 0 ? (itemFOBUSD / totalFOBUSD) : 0;
    const itemLandedCostETB = ratio * totalLandedCostETB;
    const unitLandedCostETB = item.quantityReceived > 0 ? (itemLandedCostETB / item.quantityReceived) : 0;

    return {
      ...item,
      itemFOBUSD,
      itemLandedCostETB,
      unitLandedCostETB
    };
  });

  return {
    ...shipment,
    calculations: {
      totalFOBUSD,
      totalFOBETB: totalFOBUSD * exchangeRate,
      freightUSD,
      freightETB: freightUSD * exchangeRate,
      insuranceUSD,
      insuranceETB: insuranceUSD * exchangeRate,
      cifUSD,
      cifETB,
      importDutyETB,
      exciseTaxETB,
      vatETB,
      surtaxETB,
      withholdingETB,
      totalTaxesETB,
      totalLocalCostsETB,
      totalLandedCostETB
    },
    items: itemsWithLandedCost
  };
}

// GET all shipments
router.get('/', asyncHandler(async (req, res) => {
  const shipments = await prisma.shipment.findMany({
    include: {
      proforma: {
        include: { supplier: true }
      },
      _count: { select: { items: true } }
    },
    orderBy: { id: 'desc' }
  });
  
  // Return all with calculated summary values
  const results = [];
  for (const s of shipments) {
    const calculated = await getCalculatedShipment(s.id);
    if (calculated) {
      results.push({
        id: s.id,
        proformaId: s.proformaId,
        status: s.status,
        refNumber: s.proforma.referenceNumber,
        supplierName: s.proforma.supplier ? s.proforma.supplier.name : 'Unknown',
        totalLandedCostETB: calculated.calculations.totalLandedCostETB,
        totalTaxesETB: calculated.calculations.totalTaxesETB,
        totalFOBUSD: calculated.calculations.totalFOBUSD,
        cifETB: calculated.calculations.cifETB,
        itemCount: s._count.items,
        createdAt: s.createdAt,
        receivedDate: s.receivedDate
      });
    }
  }

  res.json(results);
}));

// GET single shipment
router.get('/:id', asyncHandler(async (req, res) => {
  const calculated = await getCalculatedShipment(req.params.id);
  if (!calculated) {
    return res.status(404).json({ error: 'Shipment not found' });
  }
  res.json(calculated);
}));

// UPDATE shipment details
router.put('/:id', asyncHandler(async (req, res) => {
  const {
    status,
    freightCostUSD,
    insuranceCostUSD,
    importDutyRate,
    exciseTaxRate,
    portHandlingETB,
    clearingAgentETB,
    inlandTransportETB,
    brokerageETB,
    otherChargesETB,
    otherChargesNote,
    notes
  } = req.body;

  const data = {};
  if (status !== undefined) data.status = status;
  if (freightCostUSD !== undefined) data.freightCostUSD = Number(freightCostUSD) || 0;
  if (insuranceCostUSD !== undefined) data.insuranceCostUSD = Number(insuranceCostUSD) || 0;
  if (importDutyRate !== undefined) data.importDutyRate = Number(importDutyRate) || 0;
  if (exciseTaxRate !== undefined) data.exciseTaxRate = Number(exciseTaxRate) || 0;
  if (portHandlingETB !== undefined) data.portHandlingETB = Number(portHandlingETB) || 0;
  if (clearingAgentETB !== undefined) data.clearingAgentETB = Number(clearingAgentETB) || 0;
  if (inlandTransportETB !== undefined) data.inlandTransportETB = Number(inlandTransportETB) || 0;
  if (brokerageETB !== undefined) data.brokerageETB = Number(brokerageETB) || 0;
  if (otherChargesETB !== undefined) data.otherChargesETB = Number(otherChargesETB) || 0;
  if (otherChargesNote !== undefined) data.otherChargesNote = otherChargesNote;
  if (notes !== undefined) data.notes = notes;

  await prisma.shipment.update({
    where: { id: Number(req.params.id) },
    data
  });

  const updatedCalculated = await getCalculatedShipment(req.params.id);
  res.json(updatedCalculated);
}));

// RECEIVE shipment -> marks DELIVERED and updates inventory
router.post('/:id/receive', asyncHandler(async (req, res) => {
  const shipmentId = Number(req.params.id);
  const calculated = await getCalculatedShipment(shipmentId);

  if (!calculated) {
    return res.status(404).json({ error: 'Shipment not found' });
  }

  if (calculated.status === 'DELIVERED') {
    return res.status(400).json({ error: 'Shipment already received' });
  }

  // Use a transaction to ensure all inventory updates and status transitions succeed together
  await prisma.$transaction(async (tx) => {
    // 1. Update Shipment status
    await tx.shipment.update({
      where: { id: shipmentId },
      data: {
        status: 'DELIVERED',
        receivedDate: new Date().toISOString().split('T')[0]
      }
    });

    // 2. Update Proforma status
    await tx.proforma.update({
      where: { id: calculated.proformaId },
      data: { status: 'RECEIVED' }
    });

    // 3. Loop through items and add to Part stock
    for (const item of calculated.items) {
      if (!item.partNumber) continue;

      const unitCostETB = item.unitLandedCostETB || 0;
      
      // Look for part in stock
      const existingPart = await tx.part.findUnique({
        where: { partNumber: item.partNumber }
      });

      if (existingPart) {
        // Calculate new weighted cost price or update cost price
        const currentStock = existingPart.quantityInStock || 0;
        const incomingQty = item.quantityReceived || 0;
        const totalQty = currentStock + incomingQty;
        
        let newCostPrice = unitCostETB;
        if (totalQty > 0) {
          // Weighted average cost price
          newCostPrice = ((existingPart.costPrice * currentStock) + (unitCostETB * incomingQty)) / totalQty;
        }

        const updatedPart = await tx.part.update({
          where: { id: existingPart.id },
          data: {
            quantityInStock: totalQty,
            costPrice: Number(newCostPrice.toFixed(2)),
            // If sellingPrice is 0, set it with standard 30% margin
            sellingPrice: existingPart.sellingPrice > 0 ? existingPart.sellingPrice : Number((newCostPrice * 1.30).toFixed(2)),
            supplierId: calculated.proforma.supplierId || existingPart.supplierId
          }
        });

        // Link shipment item to the part
        await tx.shipmentItem.update({
          where: { id: item.id },
          data: { partId: updatedPart.id, landedCostETB: unitCostETB }
        });
      } else {
        // Create new part in catalog
        const newPart = await tx.part.create({
          data: {
            partNumber: item.partNumber,
            name: item.description || `Imported Part ${item.partNumber}`,
            brand: item.brand || null,
            category: 'Imported',
            quantityInStock: item.quantityReceived,
            costPrice: Number(unitCostETB.toFixed(2)),
            sellingPrice: Number((unitCostETB * 1.30).toFixed(2)), // standard 30% markup default
            supplierId: calculated.proforma.supplierId
          }
        });

        // Link shipment item to the part
        await tx.shipmentItem.update({
          where: { id: item.id },
          data: { partId: newPart.id, landedCostETB: unitCostETB }
        });
      }
    }
  });

  res.json({ message: 'Shipment received, inventory and cost prices updated successfully' });
}));

// DELETE a shipment
router.delete('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const shipment = await prisma.shipment.findUnique({
    where: { id }
  });
  if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
  if (shipment.status === 'DELIVERED') {
    return res.status(400).json({ error: 'Cannot delete a shipment that has already been delivered and added to inventory.' });
  }

  // Revert proforma status
  await prisma.proforma.update({
    where: { id: shipment.proformaId },
    data: { status: 'NEGOTIATING' }
  });

  await prisma.shipment.delete({
    where: { id }
  });
  res.status(204).end();
}));

export default router;
