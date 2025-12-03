import express from 'express';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const app = express();
const PORT = 3001;

app.use(express.json());

// In-memory database
let database: Record<string, unknown> = {};

// Load initial data from JSON file
async function loadData() {
  try {
    const dataPath = join(process.cwd(), 'data', 'config.json');
    const data = await readFile(dataPath, 'utf-8');
    database = JSON.parse(data);
    console.log('Data loaded successfully');
  } catch (error) {
    console.log('No initial data found, starting with empty database');
  }
}

// Save data to JSON file
async function saveData() {
  try {
    const dataPath = join(process.cwd(), 'data', 'config.json');
    await writeFile(dataPath, JSON.stringify(database, null, 2));
    console.log('Data saved successfully');
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// API Routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/data', (_req, res) => {
  res.json(database);
});

app.post('/api/data', async (req, res) => {
  database = { ...database, ...req.body };
  await saveData();
  res.json({ success: true, data: database });
});

// Start server
loadData().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
});
