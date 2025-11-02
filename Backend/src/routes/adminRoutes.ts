import express from 'express';
import supabase from "../config/supabaseClient";
import adminAuth from "../middleware/adminAuth";
const router = express.Router();

router.use(adminAuth);

// === STATIONS API ===

router.post('/stations', async (req, res) => {
  const { stationId, stationName, stationLocation, stationLocationURL } = req.body;
  const { data, error } = await supabase
    .from('stations')
    .insert({
      station_id: stationId,
      station_name: stationName,
      station_location: stationLocation,
      station_location_url: stationLocationURL,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/stations/:id', async (req, res) => {
  const { id } = req.params;
  const { station_name, station_location, station_location_url } = req.body;

  const { data, error } = await supabase
    .from('stations')
    .update({
      station_name,
      station_location,
      station_location_url,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/stations/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('stations').delete().eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ message: 'Station deleted successfully' });
});


// === ROUTES API ===

router.post('/routes', async (req, res) => {
  const { name, stations } = req.body;
  const { data, error } = await supabase
    .from('routes')
    .insert({
      name,
      stations,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/routes/:id', async (req, res) => {
  const { id } = req.params;
  const { name, stations } = req.body;

  const { data, error } = await supabase
    .from('routes')
    .update({ name, stations })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/routes/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('routes').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ message: 'Route deleted successfully' });
});


// === TRAINS API ===

router.post('/trains', async (req, res) => {
  const { name, code, direction, route_id, stoppages } = req.body;

  const { data, error } = await supabase
    .from('trains')
    .insert({ name, code, direction, route_id, stoppages })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/trains/:id', async (req, res) => {
  const { id } = req.params;
  const { name, code, direction, route_id, stoppages } = req.body;

  const { data, error } = await supabase
    .from('trains')
    .update({ name, code, direction, route_id, stoppages })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/trains/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('trains').delete().eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ message: 'Train deleted successfully' });
});


// === LIVE STATUS API ===

router.post('/status/update', async (req, res) => {
  const { train_id, date, lap_completed, arrivals, last_completed_station_id } = req.body;

  // The frontend sends a JSON array for 'arrivals'.
  // Supabase client handles stringifying it for the 'jsonb' column.
  const { data, error } = await supabase
    .from('daily_status')
    .upsert(
      {
        train_id,
        date,
        lap_completed,
        arrivals, // Send the array directly
        last_completed_station_id,
      },
      {
        onConflict: 'train_id, date',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('Supabase upsert error:', error);
    return res.status(500).json({ error: error.message });
  }

  // CRITICAL: Parse the 'arrivals' JSON before sending back
  // (As done in the public route, for consistency)
  if (data && data.arrivals && typeof data.arrivals === 'string') {
    try {
      data.arrivals = JSON.parse(data.arrivals);
    } catch (e) {
      data.arrivals = [];
    }
  } else if (data && !data.arrivals) {
    data.arrivals = [];
  }

  res.json(data);
});


module.exports = router;

