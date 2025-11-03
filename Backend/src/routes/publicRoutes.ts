import express from "express";
import supabase from "../config/supabaseClient.ts";

const router = express.Router();

// --- GET ALL STATIONS ---
router.get('/stations', async (req, res) => {
  const { data, error } = await supabase
    .from('stations')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// --- GET ALL ROUTES ---
router.get('/routes', async (req, res) => {
  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// --- GET ALL TRAINS ---
router.get('/trains', async (req, res) => {
  const { data, error } = await supabase
    .from('trains')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// --- GET LIVE STATUS FOR A SINGLE TRAIN (FOR TODAY) ---
router.get('/status/:trainId', async (req, res) => {
  const { trainId } = req.params;
  // Use the 'date' query param if provided, otherwise default to today
  const dateQuery = req.query.date as string | undefined;
  const date = dateQuery || new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const { data, error } = await supabase
    .from('daily_status')
    .select('*')
    .eq('train_id', trainId)
    .eq('date', date)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
    return res.status(500).json({ error: error.message });
  }

  if (data && data.arrivals && typeof data.arrivals === 'string') {
    try {
      data.arrivals = JSON.parse(data.arrivals);
    } catch (e) {
      console.error('Failed to parse arrivals JSON:', e);
      data.arrivals = []; // Default to empty on error
    }
  } else if (data && !data.arrivals) {
    data.arrivals = []; // Default to empty if null
  }

  res.json(data); // Will be null if no entry for today
});

// --- NEW: GET 7-DAY HISTORY FOR A SINGLE TRAIN ---
router.get('/history/:trainId', async (req, res) => {
  const { trainId } = req.params;

  // Get today's date
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today

  // Get date 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0); // Start of that day

  const { data, error } = await supabase
    .from('daily_status')
    .select('date, arrivals')
    .eq('train_id', trainId)
    .gte('date', sevenDaysAgo.toISOString().split('T')[0])
    .lte('date', today.toISOString().split('T')[0])
    .order('date', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // Parse 'arrivals' for each historical record
  const parsedData = data.map(record => {
    let arrivals = [];
    if (record.arrivals && typeof record.arrivals === 'string') {
      try {
        arrivals = JSON.parse(record.arrivals);
      } catch (e) {
        console.error(`Failed to parse arrivals for date ${record.date}:`, e);
      }
    } else if (Array.isArray(record.arrivals)) {
      arrivals = record.arrivals;
    }
    return { ...record, arrivals };
  });

  res.json(parsedData);
});

export default router;
