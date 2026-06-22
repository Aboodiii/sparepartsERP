# Walkthrough — Spare Parts Importer Expansion

We have successfully implemented and deployed the full system expansion! Both the backend server (on port 4000) and frontend interface (on port 5173) are running in the background.

---

## 🌟 New Features Built

### 1. Presales & Proforma Manager (`/proformas`)
- **Excel Auto-Detection Heuristics**: Supports parsing files like `Daot Order 埃塞俄比亚.xlsx` and `埃5 BYD yuan up` by searching for keywords or fallback serial-number row formats.
- **Header Customization**: Link proformas to suppliers, edit currency exchange rates, adjust invoice date, and reference numbers.
- **Negotiation Interface**: Inline item editor to adjust quantities and unit USD prices.
- **Excel Re-Export**: Regenerates a beautiful Excel sheet (`exceljs`) containing the finalized negotiated prices and quantities.

### 2. Import Shipment & Customs Tracker (`/shipments`)
- Spawns a shipment automatically once a Proforma is confirmed.
- **Ethiopian Landed Cost & Customs Tax Calculator**:
  - **CIF calculation**: `FOB (USD) + Freight (USD) + Insurance (USD) = CIF (USD)`.
  - **Import Duty**: Customs value based on input rate.
  - **Excise Tax**: Rate applied to `(CIF + Duty)`.
  - **VAT**: `15%` of `(CIF + Duty + Excise)`.
  - **Surtax**: `10%` of `(CIF + Duty + Excise + VAT)`.
  - **Withholding Tax**: `3%` of `CIF`.
  - **Local Charges**: Input port handling, clearing agent fees, inland transport, brokerage, and misc costs in ETB.
  - **Total Landed Cost**: Sum of CIF in ETB + all customs taxes + local charges.
  - **Landed Cost Per Unit**: Automatically allocated to item inventory based on proportional FOB ratio.

### 3. Automated Inventory Stocking
- Clicking **"Mark Received & Stock Inventory"** on the shipment details page:
  - Changes shipment status to `DELIVERED`.
  - Automatically updates/creates parts in the catalog (`Part` table).
  - Automatically increases the item stock (`quantityInStock`).
  - Automatically computes the new **weighted average cost price** for existing items, or sets the calculated landed unit cost price for new items.
  - Sets a default selling price using a standard 30% markup (if no selling price is set).

### 4. Financial Analytics Dashboard (`/finance`)
- **Financial Cards**:
  - *Delivered Investment*: Total landed cost of received shipments.
  - *Customs & Taxes Paid*: Total duties, excise, VAT, surtax, and withholding paid to Ethiopian customs.
  - *In-Transit Capital*: Value of shipped goods currently at sea or customs.
  - *Average Selling Markup*: Current average profit margin on inventory parts.
- **Expense Breakdown Chart**: Bar chart representing Goods Cost vs. Freight vs. Duties vs. Local charges for each order.
- **Ledger Table**: A detailed ledger showing the full cost breakdown of all orders.

---

## 📂 Summary of Code Changes

### Backend
- [Prisma Schema](file:///d:/spareparts-importer/backend/prisma/schema.prisma): Added `Proforma`, `ProformaItem`, `Shipment`, and `ShipmentItem` models. Pushed to `dev.db`.
- [Server Entry](file:///d:/spareparts-importer/backend/src/server.js): Registered routers for `/api/proformas`, `/api/shipments`, and `/api/finance`.
- [Proforma Router](file:///d:/spareparts-importer/backend/src/routes/proformas.js): Built uploading, editing, confirming, and Excel exporting.
- [Shipment Router](file:///d:/spareparts-importer/backend/src/routes/shipments.js): Built landing cost computations, tax calculations, and inventory updates.
- [Finance Router](file:///d:/spareparts-importer/backend/src/routes/finance.js): Built dashboard aggregation analytics.

### Frontend
- [Layout Navigation](file:///d:/spareparts-importer/frontend/src/layout/AppLayout.jsx): Added new PRESALES, SHIPMENTS, INVENTORY, and FINANCES sections to the sidebar menu.
- [Proformas Page](file:///d:/spareparts-importer/frontend/src/pages/Proformas.jsx): Upload drag-and-drop zone + list of quotes.
- [Proforma Detail Page](file:///d:/spareparts-importer/frontend/src/pages/ProformaDetail.jsx): Table of items, quote header updates, negotiated prices, and excel exports.
- [Shipments Page](file:///d:/spareparts-importer/frontend/src/pages/Shipments.jsx): Track active and historical shipments.
- [Shipment Detail Page](file:///d:/spareparts-importer/frontend/src/pages/ShipmentDetail.jsx): Landed cost calculator and automated receiving page.
- [Finance Page](file:///d:/spareparts-importer/frontend/src/pages/Finance.jsx): Aggregated costs and Recharts visual representation.
