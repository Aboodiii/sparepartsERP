// The entry point. Wires middleware + routes together and starts listening.
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import partsRouter from './routes/parts.js';
import suppliersRouter from './routes/suppliers.js';
import customersRouter from './routes/customers.js';
import dashboardRouter from './routes/dashboard.js';
import proformasRouter from './routes/proformas.js';
import shipmentsRouter from './routes/shipments.js';
import financeRouter from './routes/finance.js';

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    /\.vercel\.app$/,
  ],
  credentials: true,
}));
app.use(express.json());  // parse JSON request bodies into req.body

// Health check — open http://localhost:4000/api/health to confirm it's up.
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Each resource lives under its own path prefix.
app.use('/api/parts', partsRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/customers', customersRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/proformas', proformasRouter);
app.use('/api/shipments', shipmentsRouter);
app.use('/api/finance', financeRouter);

// Central error handler — anything thrown in a route lands here.
app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'A record with that unique value already exists.' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found.' });
  }
  res.status(500).json({ error: err.message || 'Something went wrong.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
