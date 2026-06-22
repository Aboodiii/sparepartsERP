// Format a number as Ethiopian Birr, e.g. 4800 -> "ETB 4,800.00"
export const etb = (value) =>
  'ETB ' + Number(value || 0).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
