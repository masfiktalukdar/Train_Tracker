import { Router } from "express";
import type { Request, Response } from "express";
import supabase from "../config/supabaseClient.ts";
import adminAuth from "../middleware/adminAuth.ts";
const router = Router();

// This middleware ensures only authenticated admins can access any route in this file.
router.use(adminAuth);

// === DASHBOARD STATS ===
router.get("/dashboard/stats", async (req: Request, res: Response) => {
  try {
    // --- 1. Get all counts in parallel ---
    const [
      totalUsersData,
      totalRoutesData,
      totalStationsData,
      totalTrainsData,
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("routes").select("*", { count: "exact", head: true }),
      supabase.from("stations").select("*", { count: "exact", head: true }),
      supabase.from("trains").select("*", { count: "exact", head: true }),
    ]);

    // --- 2. Get user registration data for the chart ---
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);

    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("created_at")
      .gt("created_at", sixMonthsAgo.toISOString());

    if (usersError) throw usersError;

    // --- 3. Process data in JavaScript ---
    const counts = new Map<string, number>();
    const monthFormatter = new Intl.DateTimeFormat("en-US", {
      month: "short",
      year: "2-digit",
    });

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = monthFormatter.format(date);
      counts.set(key, 0);
    }

    if (users) {
      for (const user of users) {
        const key = monthFormatter.format(new Date(user.created_at));
        if (counts.has(key)) {
          counts.set(key, counts.get(key)! + 1);
        }
      }
    }

    const chartData = Array.from(counts.entries()).map(
      ([date, count]) => ({
        date: date,
        registrationCount: count,
        month: date.split(" ")[0],
        showMonthLabel: true,
      })
    );

    // --- 4. Consolidate all stats ---
    const stats = {
      totalUsers: totalUsersData.count ?? 0,
      totalRoutes: totalRoutesData.count ?? 0,
      totalStations: totalStationsData.count ?? 0,
      totalTrains: totalTrainsData.count ?? 0,
      chartData: chartData,
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "An unknown error occurred" });
    }
  }
});


// === LIVE STATUS API ===
router.post('/status/update', async (req: Request, res: Response) => {
  const { train_id, date, lap_completed, arrivals, last_completed_station_id } = req.body;

  const { data, error } = await supabase
    .from('daily_status')
    .upsert(
      {
        train_id,
        date,
        lap_completed,
        arrivals,
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


// =================================================================
// --- NEW: MISSING STATION ROUTES ---
// =================================================================

// CREATE a new station
router.post('/stations', async (req: Request, res: Response) => {
  const { stationId, stationName, stationLocation, stationLocationURL } = req.body;

  // Map frontend camelCase to backend snake_case
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

// UPDATE an existing station
router.put('/stations/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body; // Frontend already sends snake_case for updates

  const { data, error } = await supabase
    .from('stations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE a station
router.delete('/stations/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('stations')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send(); // 204 No Content
});


// =================================================================
// --- NEW: MISSING ROUTE ROUTES ---
// =================================================================

// CREATE a new route
router.post('/routes', async (req: Request, res: Response) => {
  const { name, stations } = req.body;

  const { data, error } = await supabase
    .from('routes')
    .insert({ name, stations }) // Body matches table structure
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// UPDATE an existing route
router.put('/routes/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, stations } = req.body; // Body matches table structure

  const { data, error } = await supabase
    .from('routes')
    .update({ name, stations })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE a route
router.delete('/routes/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('routes')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send(); // 204 No Content
});


// =================================================================
// --- NEW: MISSING TRAIN ROUTES ---
// =================================================================

// CREATE a new train
router.post('/trains', async (req: Request, res: Response) => {
  // Frontend sends data that matches snake_case table, so no mapping needed
  const { name, code, direction, route_id, stoppages } = req.body;

  const { data, error } = await supabase
    .from('trains')
    .insert({ name, code, direction, route_id, stoppages })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// UPDATE an existing train
router.put('/trains/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body; // Frontend sends partial data matching table

  const { data, error } = await supabase
    .from('trains')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE a train
router.delete('/trains/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('trains')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send(); // 204 No Content
});


export default router;
