const express = require('express');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const multer = require('multer');
const pdfParse = require('pdf-parse');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Multer for file uploads (store in memory)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// Database file
const DB_PATH = path.join(__dirname, 'data.sqlite');
const dbExists = fs.existsSync(DB_PATH);
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  if (!dbExists) {
    db.run(`
      CREATE TABLE budgets (
        id TEXT PRIMARY KEY,
        payload TEXT NOT NULL
      )
    `);
    db.run(`
      CREATE TABLE meta (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);
    db.run(`
      CREATE TABLE items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT UNIQUE NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Database initialized');
  }
});

// Serve static frontend (optional)
app.use('/', express.static(path.join(__dirname, '..')));

// Budgets endpoints
app.get('/api/budgets', (req, res) => {
  db.all('SELECT payload FROM budgets', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const budgets = rows.map(r => JSON.parse(r.payload));
    res.json(budgets);
  });
});

app.post('/api/budgets', (req, res) => {
  const budget = req.body;
  if (!budget || !budget.id) return res.status(400).json({ error: 'Invalid budget payload' });
  const payload = JSON.stringify(budget);
  db.run('INSERT OR REPLACE INTO budgets(id, payload) VALUES(?, ?)', [budget.id, payload], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true, id: budget.id });
  });
});

app.get('/api/budgets/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT payload FROM budgets WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(JSON.parse(row.payload));
  });
});

app.delete('/api/budgets/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM budgets WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

// Logo endpoints (store as meta key 'globalLogo')
app.get('/api/logo', (req, res) => {
  db.get('SELECT value FROM meta WHERE key = ?', ['globalLogo'], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row || !row.value) return res.status(404).json({ error: 'Logo not set' });
    res.json({ logo: row.value });
  });
});

app.post('/api/logo', (req, res) => {
  const logo = req.body.logo;
  if (!logo) return res.status(400).json({ error: 'No logo provided' });
  db.run('INSERT OR REPLACE INTO meta(key, value) VALUES(?, ?)', ['globalLogo', logo], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

// Items endpoints - para autocompletar descripciones
app.get('/api/items', (req, res) => {
  db.all('SELECT DISTINCT description FROM items ORDER BY createdAt DESC LIMIT 100', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const descriptions = rows.map(r => r.description);
    res.json({ items: descriptions });
  });
});

app.post('/api/items', (req, res) => {
  const { description } = req.body;
  if (!description || description.trim() === '') {
    return res.status(400).json({ error: 'Description required' });
  }
  db.run('INSERT OR IGNORE INTO items(description) VALUES(?)', [description.trim()], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Backup endpoint: return globalLogo and all budgets as a single JSON
app.get('/api/backup', (req, res) => {
  db.all('SELECT payload FROM budgets', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const budgets = rows.map(r => JSON.parse(r.payload));
    db.get('SELECT value FROM meta WHERE key = ?', ['globalLogo'], (err2, row) => {
      if (err2) return res.status(500).json({ error: err2.message });
      const globalLogo = row && row.value ? row.value : null;
      res.json({ globalLogo, budgets });
    });
  });
});

// Import PDF endpoint: accepts form-data file field 'file'
app.post('/api/import-pdf', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const data = await pdfParse(req.file.buffer);
    const text = data.text || '';
    // Parse structured info from extracted text
    const parsed = parseBudgetFromText(text);

    // Create budget object
    const id = 'pdf-' + Date.now();
    const now = new Date().toISOString();
    const budget = Object.assign({
      id,
      createdAt: now,
      savedAt: now,
      logo: null
    }, parsed);

    const payload = JSON.stringify(budget);
    db.run('INSERT INTO budgets(id, payload) VALUES(?, ?)', [id, payload], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true, id, parsed });
    });
  } catch (err) {
    console.error('Error parsing PDF', err);
    res.status(500).json({ error: 'Error parsing PDF', details: err.message });
  }
});

// Basic heuristic parser for the PDF text content
function parseBudgetFromText(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const result = { client: {}, items: [], subtotal: 0, iva: 0, total: 0, includeIVA: true };

  console.log('PDF Text (first 50 lines):', lines.slice(0, 50).join('\n'));

  // Search for client info
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^Cliente:/i.test(l)) {
      result.client.name = l.replace(/^Cliente:\s*/i, '').trim();
    }
    if (/^Email:/i.test(l)) {
      result.client.email = l.replace(/^Email:\s*/i, '').trim();
    }
    if (/^Fecha:/i.test(l)) {
      result.client.date = l.replace(/^Fecha:\s*/i, '').trim();
    }
    if (/^N[oº]*\s*Presupuesto:/i.test(l) || /^N[uú]mero:/i.test(l)) {
      result.client.number = l.replace(/^(N[oº]*\s*Presupuesto:|N[uú]mero:)\s*/i, '').trim();
    }
  }

  // Find table start (line that contains 'Descripción' AND 'Cant.')
  let tableStart = -1;
  for (let i = 0; i < lines.length; i++) {
    // Look for header row with column names
    if (lines[i].includes('Descripción') || lines[i].includes('DESCRIPCIÓN')) {
      tableStart = i + 1;
      break;
    }
  }

  // Find totals start (Subtotal:, TOTAL:, etc.)
  let totalsIndex = lines.findIndex(l => 
    /^Subtotal:?/i.test(l) || /^TOTAL:?/i.test(l) || /^Total:?/i.test(l) || /^Subtotal:/i.test(l)
  );
  if (totalsIndex === -1) totalsIndex = lines.length;

  // Parse item lines (including multiline support)
  if (tableStart >= 0 && tableStart < totalsIndex) {
    let currentItem = null;
    for (let i = tableStart; i < totalsIndex; i++) {
      const line = lines[i];
      
      // Skip empty or header-like lines
      if (!line || /Cant\.|Precio|Subtotal/i.test(line)) continue;
      
      // Try to match: description + qty + price + subtotal
      // Pattern: desc (with possible decimals) qty price subtotal
      const numberPattern = /([\d.,€]+)$/g;
      const numbers = [];
      let match;
      const lineForNumbers = line;
      
      // Extract all numbers/amounts from the end
      const matches = [...lineForNumbers.matchAll(/[\d.,€]+/g)];
      const lastNumbers = matches.slice(-3).map(m => m[0]); // Get last 3 numbers
      
      if (lastNumbers.length >= 2) {
        // Try to extract description and numbers
        let desc = line;
        const numbersAtEnd = line.match(/([\d.,]+)\s*(€)?\s*([\d.,]+)\s*(€)?\s*([\d.,]+)?\s*(€)?$/);
        
        if (numbersAtEnd) {
          // We have numbers at the end
          desc = line.substring(0, line.lastIndexOf(numbersAtEnd[0])).trim();
          
          let qty, price, subtotal;
          if (lastNumbers.length === 3) {
            // qty, price, subtotal
            qty = parseFloat(lastNumbers[0].replace(/,/g, '.').replace('€', '')) || 1;
            price = parseFloat(lastNumbers[1].replace(/,/g, '.').replace('€', '')) || 0;
            subtotal = parseFloat(lastNumbers[2].replace(/,/g, '.').replace('€', '')) || (qty * price);
          } else {
            // Just price and subtotal, assume qty = 1
            price = parseFloat(lastNumbers[0].replace(/,/g, '.').replace('€', '')) || 0;
            subtotal = parseFloat(lastNumbers[1].replace(/,/g, '.').replace('€', '')) || price;
            qty = 1;
          }
          
          if (desc && price >= 0) {
            result.items.push({ 
              id: Date.now() + i, 
              description: desc, 
              quantity: qty, 
              price, 
              subtotal: subtotal || (qty * price)
            });
          }
        }
      }
    }
  }

  // Parse totals
  for (let i = totalsIndex; i < lines.length; i++) {
    const l = lines[i];
    const mSub = l.match(/Subtotal[:\s]*([\d.,]+)/i);
    const mIva = l.match(/IVA[^\d]*([\d.,]+)/i);
    const mTot = l.match(/TOTAL[:\s]*([\d.,€]+)/i) || l.match(/^Total[:\s]*([\d.,€]+)/i);
    
    if (mSub) result.subtotal = parseFloat(mSub[1].replace(/,/g, '.').replace('€', ''));
    if (mIva) result.iva = parseFloat(mIva[1].replace(/,/g, '.').replace('€', ''));
    if (mTot) result.total = parseFloat(mTot[1].replace(/,/g, '.').replace('€', ''));
  }

  // Fallback: compute totals if not found
  if (!result.subtotal && result.items.length) {
    result.subtotal = result.items.reduce((s, it) => s + (it.subtotal || (it.quantity * it.price)), 0);
  }
  if (!result.total) result.total = result.subtotal + (result.iva || 0);

  return result;
}

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
