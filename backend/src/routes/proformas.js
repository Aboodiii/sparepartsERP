import { Router } from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import prisma from '../prisma.js';
import { asyncHandler } from '../asyncHandler.js';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Helper to parse Excel sheets
function parseExcelSheet(sheetName, ws) {
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  let headerRowIndex = -1;

  // Try to find a header row
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = rows[i];
    if (!row) continue;
    const joined = row.join(' ').toLowerCase();
    if (
      joined.includes('part number') ||
      joined.includes('partnumber') ||
      joined.includes('item number') ||
      joined.includes('english') ||
      (joined.includes('price') && joined.includes('qty'))
    ) {
      headerRowIndex = i;
      break;
    }
  }

  const items = [];
  if (headerRowIndex !== -1) {
    const header = rows[headerRowIndex].map((h) => String(h).trim().toLowerCase());
    
    // Find column indexes
    const partNumIdx = header.findIndex((h) => h.includes('part number') || h.includes('partnumber') || h.includes('item number') || h.includes('no.'));
    const descIdx = header.findIndex((h) => h.includes('english') || h.includes('description') || h.includes('name'));
    const brandIdx = header.findIndex((h) => h.includes('brand') || h.includes('classification'));

    // Check if we have COPY and ORIGINAL columns (for BYD Yuan file format)
    const hasCopyAndOriginal = header.some(h => h.includes('copy price')) && header.some(h => h.includes('original price'));

    if (hasCopyAndOriginal) {
      // We will generate two sets of items or let the user choose.
      // Let's grab the "COPY" ones first.
      const copyPriceIdx = header.findIndex(h => h.includes('copy price'));
      const copyQtyIdx = header.findIndex((h, idx) => idx > copyPriceIdx && (h === 'qty' || h === 'quantity' || h.includes('数量')));
      
      const origPriceIdx = header.findIndex(h => h.includes('original price'));
      const origQtyIdx = header.findIndex((h, idx) => idx > origPriceIdx && (h === 'qty' || h === 'quantity' || h.includes('数量')));

      for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const partNum = partNumIdx !== -1 ? String(row[partNumIdx] || '').trim() : '';
        const desc = descIdx !== -1 ? String(row[descIdx] || '').trim() : '';
        if (!partNum && !desc) continue;
        if (partNum.toLowerCase().includes('total') || desc.toLowerCase().includes('total')) continue;

        // Add copy item if qty > 0
        const copyQty = parseFloat(row[copyQtyIdx]) || 0;
        const copyPrice = parseFloat(row[copyPriceIdx]) || 0;
        if (copyQty > 0 || copyPrice > 0) {
          items.push({
            partNumber: partNum || null,
            description: desc + ' (Copy)',
            brand: brandIdx !== -1 ? String(row[brandIdx] || '').trim() : 'Copy Brand',
            quantity: copyQty,
            supplierPrice: copyPrice,
            negotiatedPrice: copyPrice,
            notes: 'Imported from Copy columns'
          });
        }

        // Add original item if qty > 0
        const origQty = parseFloat(row[origQtyIdx]) || 0;
        const origPrice = parseFloat(row[origPriceIdx]) || 0;
        if (origQty > 0 || origPrice > 0) {
          items.push({
            partNumber: partNum || null,
            description: desc + ' (Original)',
            brand: brandIdx !== -1 ? String(row[brandIdx] || '').trim() : 'Original Brand',
            quantity: origQty,
            supplierPrice: origPrice,
            negotiatedPrice: origPrice,
            notes: 'Imported from Original columns'
          });
        }
      }
    } else {
      // Standard headers
      let qtyIdx = header.findIndex((h) => h === 'qty' || h === 'quantity' || h.includes('数量'));
      let priceIdx = header.findIndex((h) => h.includes('price') || h.includes('cost') || h.includes('价格'));

      if (qtyIdx === -1) qtyIdx = header.findIndex((h) => h.includes('qty') || h.includes('quantity'));
      if (priceIdx === -1) priceIdx = header.findIndex((h) => h.includes('price') || h.includes('cost') || h.includes('价格'));

      for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const partNum = partNumIdx !== -1 ? String(row[partNumIdx] || '').trim() : '';
        const desc = descIdx !== -1 ? String(row[descIdx] || '').trim() : '';
        if (!partNum && !desc) continue;
        if (partNum.toLowerCase().includes('total') || desc.toLowerCase().includes('total')) continue;

        const qty = qtyIdx !== -1 ? parseFloat(row[qtyIdx]) || 0 : 0;
        const price = priceIdx !== -1 ? parseFloat(row[priceIdx]) || 0 : 0;

        items.push({
          partNumber: partNum || null,
          description: desc || String(row[3] || '').trim() || null,
          brand: brandIdx !== -1 ? String(row[brandIdx] || '').trim() : null,
          quantity: qty,
          supplierPrice: price,
          negotiatedPrice: price,
          notes: ''
        });
      }
    }
  } else {
    // Heuristic parsing for files like Daot Order 埃塞俄比亚.xlsx which don't have standard column headers in first few rows
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 3) continue;
      const col0 = String(row[0]).trim();
      const isSerial = /^\d+$/.test(col0);
      if (isSerial) {
        const partNum = String(row[1] || '').trim();
        const name = String(row[2] || '').trim();
        const descDetails = String(row[3] || '').trim();
        const qty = parseFloat(row[4]) || 0;
        const brand = String(row[5] || '').trim();
        const price = parseFloat(row[7]) || 0;

        items.push({
          partNumber: partNum || null,
          description: name + (descDetails ? ` (${descDetails})` : ''),
          brand: brand || null,
          quantity: qty,
          supplierPrice: price,
          negotiatedPrice: price,
          notes: ''
        });
      }
    }
  }
  return items;
}

// UPLOAD Excel Proforma
router.post('/upload', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const workbook = XLSX.readFile(req.file.path);
    let allItems = [];

    // Parse all sheets
    for (const sheetName of workbook.SheetNames) {
      const sheetItems = parseExcelSheet(sheetName, workbook.Sheets[sheetName]);
      allItems = allItems.concat(sheetItems);
    }

    if (allItems.length === 0) {
      return res.status(400).json({ error: 'Could not detect any spare parts items in the uploaded Excel file. Please verify formatting.' });
    }

    // Create draft proforma in database
    const proforma = await prisma.proforma.create({
      data: {
        referenceNumber: `PI-${Date.now().toString().slice(-6)}`,
        invoiceDate: new Date().toISOString().split('T')[0],
        status: 'DRAFT',
        items: {
          create: allItems
        }
      },
      include: {
        items: true
      }
    });

    res.status(201).json(proforma);
  } catch (err) {
    console.error('Excel parsing error:', err);
    res.status(500).json({ error: `Excel processing failed: ${err.message}` });
  }
}));

// GET all proformas
router.get('/', asyncHandler(async (req, res) => {
  const proformas = await prisma.proforma.findMany({
    include: {
      supplier: true,
      _count: { select: { items: true } }
    },
    orderBy: { id: 'desc' }
  });
  res.json(proformas);
}));

// GET single proforma with items
router.get('/:id', asyncHandler(async (req, res) => {
  const proforma = await prisma.proforma.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      supplier: true,
      items: true,
      shipment: true
    }
  });

  if (!proforma) {
    return res.status(404).json({ error: 'Proforma not found' });
  }

  res.json(proforma);
}));

// UPDATE proforma header (status, exchangeRate, supplierId, notes, etc.)
router.put('/:id', asyncHandler(async (req, res) => {
  const { status, exchangeRate, supplierId, notes, referenceNumber, invoiceDate } = req.body;

  const data = {};
  if (status !== undefined) data.status = status;
  if (exchangeRate !== undefined) data.exchangeRate = Number(exchangeRate) || 0;
  if (supplierId !== undefined) data.supplierId = supplierId ? Number(supplierId) : null;
  if (notes !== undefined) data.notes = notes;
  if (referenceNumber !== undefined) data.referenceNumber = referenceNumber;
  if (invoiceDate !== undefined) data.invoiceDate = invoiceDate;

  const proforma = await prisma.proforma.update({
    where: { id: Number(req.params.id) },
    data,
    include: { supplier: true }
  });

  res.json(proforma);
}));

// UPDATE single proforma item quantity or negotiated price
router.put('/:id/items/:itemId', asyncHandler(async (req, res) => {
  const { quantity, negotiatedPrice, notes } = req.body;

  const data = {};
  if (quantity !== undefined) data.quantity = Number(quantity) || 0;
  if (negotiatedPrice !== undefined) data.negotiatedPrice = Number(negotiatedPrice) || 0;
  if (notes !== undefined) data.notes = notes;

  const item = await prisma.proformaItem.update({
    where: { id: Number(req.params.itemId) },
    data
  });

  res.json(item);
}));

// CONFIRM and Create Shipment
router.post('/:id/confirm', asyncHandler(async (req, res) => {
  const proformaId = Number(req.params.id);

  const proforma = await prisma.proforma.findUnique({
    where: { id: proformaId },
    include: { items: true, shipment: true }
  });

  if (!proforma) {
    return res.status(404).json({ error: 'Proforma not found' });
  }

  // Update status to confirmed
  await prisma.proforma.update({
    where: { id: proformaId },
    data: { status: 'CONFIRMED' }
  });

  // Check if shipment already exists
  let shipment = proforma.shipment;
  if (!shipment) {
    // Create new Shipment
    shipment = await prisma.shipment.create({
      data: {
        proformaId,
        status: 'IN_TRANSIT',
        freightCostUSD: 0,
        insuranceCostUSD: 0,
        importDutyRate: 10,
        exciseTaxRate: 0
      }
    });

    // Populate shipment items
    const shipmentItemsData = proforma.items.map(item => ({
      shipmentId: shipment.id,
      partNumber: item.partNumber,
      description: item.description,
      quantityReceived: item.quantity,
      unitCostUSD: item.negotiatedPrice !== null ? item.negotiatedPrice : item.supplierPrice,
      landedCostETB: 0 // Will be computed
    }));

    await prisma.shipmentItem.createMany({
      data: shipmentItemsData
    });
  }

  res.json({ message: 'Order confirmed and shipment created successfully', shipmentId: shipment.id });
}));

// EXPORT/DOWNLOAD Excel
router.get('/:id/export', asyncHandler(async (req, res) => {
  const proforma = await prisma.proforma.findUnique({
    where: { id: Number(req.params.id) },
    include: { items: true, supplier: true }
  });

  if (!proforma) {
    return res.status(404).json({ error: 'Proforma not found' });
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Proforma Order');

  // Title Style
  worksheet.mergeCells('A1:G1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `Proforma Order: ${proforma.referenceNumber || 'N/A'}`;
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F7B3F' } };
  titleCell.alignment = { horizontal: 'center' };
  worksheet.getRow(1).height = 40;

  // Metadata
  worksheet.getCell('A3').value = 'Supplier:';
  worksheet.getCell('B3').value = proforma.supplier ? proforma.supplier.name : 'Not Specified';
  worksheet.getCell('A4').value = 'Date:';
  worksheet.getCell('B4').value = proforma.invoiceDate || 'N/A';
  worksheet.getCell('D3').value = 'Exchange Rate:';
  worksheet.getCell('E3').value = `${proforma.exchangeRate} ETB/USD`;
  worksheet.getCell('D4').value = 'Status:';
  worksheet.getCell('E4').value = proforma.status;

  // Header Row
  const headers = ['Serial No.', 'Part Number', 'Description', 'Brand', 'Qty', 'Unit Price (USD)', 'Total Price (USD)'];
  worksheet.getRow(6).values = headers;
  worksheet.getRow(6).font = { bold: true };
  worksheet.getRow(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFEF' } };

  // Item Rows
  proforma.items.forEach((item, index) => {
    const price = item.negotiatedPrice !== null ? item.negotiatedPrice : item.supplierPrice;
    const total = item.quantity * price;
    worksheet.addRow([
      index + 1,
      item.partNumber || '',
      item.description || '',
      item.brand || '',
      item.quantity,
      price,
      total
    ]);
  });

  // Totals
  const totalRowIndex = proforma.items.length + 7;
  worksheet.getCell(`E${totalRowIndex}`).value = 'Total USD:';
  worksheet.getCell(`E${totalRowIndex}`).font = { bold: true };
  worksheet.getCell(`G${totalRowIndex}`).value = { formula: `=SUM(G7:G${totalRowIndex-1})` };
  worksheet.getCell(`G${totalRowIndex}`).font = { bold: true };

  // Set Widths
  worksheet.columns.forEach((col, i) => {
    let maxLen = 12;
    worksheet.eachRow({ includeEmpty: true }, (row) => {
      const cell = row.getCell(i + 1);
      if (cell.value) {
        maxLen = Math.max(maxLen, String(cell.value).length + 2);
      }
    });
    col.width = Math.min(maxLen, 40);
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=Proforma-${proforma.referenceNumber}.xlsx`);

  await workbook.xlsx.write(res);
  res.end();
}));

// DELETE a proforma
router.delete('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  // Check if shipment is linked
  const shipment = await prisma.shipment.findUnique({
    where: { proformaId: id }
  });
  if (shipment) {
    return res.status(400).json({ error: 'Cannot delete proforma linked to an active shipment. Please delete the shipment first.' });
  }
  
  await prisma.proforma.delete({
    where: { id }
  });
  res.status(204).end();
}));

export default router;
