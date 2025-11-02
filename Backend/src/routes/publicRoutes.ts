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
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const { data, error } = await supabase
    .from('daily_status')
    .select('*')
    .eq('train_id', trainId)
    .eq('date', today)
    .single();

  if (error && error.code !== 'PGRST116') {
    return res.status(500).json({ error: error.message });
  }

  // CRITICAL: Parse the 'arrivals' JSON before sending to frontend
  // This is safe even if 'arrivals' is null or already an object
  // (though Supabase v2+ should do this automatically)
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

export default router;

