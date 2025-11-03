import { Router } from "express";
import type { Request, Response } from "express";
import supabase from "../config/supabaseClient.ts";
import adminAuth from "../middleware/adminAuth.ts";
const router = Router();

router.use(adminAuth);

// === NEW DASHBOARD STATS ENDPOINT ===
router.get("/dashboard/stats", async (req: Request, res: Response) => {
  try {
    // --- 1. Get all counts in parallel ---
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const [
      totalUsersData,
      totalRoutesData,
      totalStationsData,
      totalTrainsData,
    ] = await Promise.all([
      // a. Total registered users
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      // b. Total routes
      supabase.from("routes").select("*", { count: "exact", head: true }),
      // c. Total stations
      supabase.from("stations").select("*", { count: "exact", head: true }),
      // d. Total trains
      supabase.from("trains").select("*", { count: "exact", head: true }),
    ]);

    // --- 2. Get user registration data for the chart ---
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1); // Start from the beginning of that month

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

    // Initialize the map with the last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = monthFormatter.format(date); // "Oct '25", "Sep '25"
      counts.set(key, 0);
    }

    // Iterate over fetched users and increment counts
    if (users) {
      for (const user of users) {
        const key = monthFormatter.format(new Date(user.created_at));
        if (counts.has(key)) {
          counts.set(key, counts.get(key)! + 1);
        }
      }
    }

    // Format for the chart
    const chartData = Array.from(counts.entries()).map(
      ([date, count]) => ({
        date: date,
        registrationCount: count,
        // Add month label logic for chart
        month: date.split(" ")[0],
        showMonthLabel: true, // We'll let the frontend re-process this
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


export default router;
