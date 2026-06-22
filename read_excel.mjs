import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

const files = [
  'Daot Order 埃塞俄比亚.xlsx',
  '埃5  Byd yuan up 带图片 原厂和品牌分类 2.xlsx',
];

for (const f of files) {
  console.log('\n========== FILE:', f, '==========');
  try {
    const wb = XLSX.readFile(f, { sheetRows: 10 });
    for (const sheetName of wb.SheetNames.slice(0, 3)) {
      console.log('  -- Sheet:', sheetName, '--');
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      rows.slice(0, 8).forEach((r, i) => console.log(`  row${i}:`, JSON.stringify(r).slice(0, 200)));
    }
  } catch (e) {
    console.log('  ERROR:', e.message);
  }
}
