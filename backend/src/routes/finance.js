import { Router } from 'express';
import prisma from '../prisma.js';
import { asyncHandler } from '../asyncHandler.js';

const router = Router();

// Helper to calculate computed costs and taxes for all received/transit shipments
async function getFinanceMetrics() {
  const shipments = await prisma.shipment.findMany({
    include: {
      proforma: {
        include: { supplier: true }
      },
      items: true
    }
  });

  let totalInvestedETB = 0;
  let totalTaxesPaidETB = 0;
  let pendingShipmentsValueETB = 0;
  
  const shipmentBreakdowns = [];

  for (const s of shipments) {
    const exchangeRate = s.proforma.exchangeRate || 1.0;
    
    // Calculate FOB (USD)
    let totalFOBUSD = 0;
    s.items.forEach(item => {
      totalFOBUSD += item.quantityReceived * item.unitCostUSD;
    });

    const totalFOBETB = totalFOBUSD * exchangeRate;
    const freightCostETB = (s.freightCostUSD || 0) * exchangeRate;
    const insuranceCostETB = (s.insuranceCostUSD || 0) * exchangeRate;
    const cifETB = totalFOBETB + freightCostETB + insuranceCostETB;

    // Calculate Taxes
    const dutyRate = s.importDutyRate || 0;
    const exciseRate = s.exciseTaxRate || 0;
    const importDutyETB = cifETB * (dutyRate / 100);
    const exciseTaxETB = (cifETB + importDutyETB) * (exciseRate / 100);
    const vatETB = (cifETB + importDutyETB + exciseTaxETB) * 0.15;
    const surtaxETB = (cifETB + importDutyETB + exciseTaxETB + vatETB) * 0.10;
    const withholdingETB = cifETB * 0.03;

    const totalTaxesETB = importDutyETB + exciseTaxETB + vatETB + surtaxETB + withholdingETB;

    // Local Costs
    const localCostsETB = (s.portHandlingETB || 0) + 
                          (s.clearingAgentETB || 0) + 
                          (s.inlandTransportETB || 0) + 
                          (s.brokerageETB || 0) + 
                          (s.otherChargesETB || 0);

    const totalLandedCostETB = cifETB + totalTaxesETB + localCostsETB;

    if (s.status === 'DELIVERED') {
      totalInvestedETB += totalLandedCostETB;
      totalTaxesPaidETB += totalTaxesETB;
    } else {
      pendingShipmentsValueETB += cifETB;
    }

    shipmentBreakdowns.push({
      id: s.id,
      refNumber: s.proforma.referenceNumber,
      supplierName: s.proforma.supplier ? s.proforma.supplier.name : 'Unknown',
      status: s.status,
      goodsValueETB: totalFOBETB,
      shippingFreightETB: freightCostETB + insuranceCostETB,
      taxesETB: totalTaxesETB,
      localChargesETB: localCostsETB,
      totalLandedCostETB: totalLandedCostETB,
      receivedDate: s.receivedDate,
      createdAt: s.createdAt
    });
  }

  // Calculate Average Margin from current parts catalog
  const parts = await prisma.part.findMany();
  let totalCostForMargin = 0;
  let totalSellingForMargin = 0;

  parts.forEach(p => {
    if (p.costPrice > 0) {
      totalCostForMargin += p.costPrice * (p.quantityInStock || 1);
      totalSellingForMargin += p.sellingPrice * (p.quantityInStock || 1);
    }
  });

  const avgMarginPercent = totalCostForMargin > 0 
    ? ((totalSellingForMargin - totalCostForMargin) / totalCostForMargin) * 100 
    : 30; // default standard markup

  return {
    summary: {
      totalInvestedETB,
      totalTaxesPaidETB,
      pendingShipmentsValueETB,
      avgMarginPercent: Number(avgMarginPercent.toFixed(1))
    },
    shipments: shipmentBreakdowns
  };
}

router.get('/', asyncHandler(async (req, res) => {
  const metrics = await getFinanceMetrics();
  res.json(metrics);
}));

export default router;
