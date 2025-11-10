import { Router } from "express";
import supabase from "../config/supabaseClient.js";
import adminAuth from "../middleware/adminAuth.js";
const router = Router();
// This middleware ensures only authenticated admins can access any route in this file.
router.use(adminAuth);
// --- ADDED: Helper functions to parse JSON fields ---
const parseRoute = (route) => {
    let stations = [];
    if (route.stations && typeof route.stations === 'string') {
        try {
            stations = JSON.parse(route.stations);
        }
        catch (e) {
            console.error(`Failed to parse stations for route ${route.id}:`, e);
        }
    }
    else if (Array.isArray(route.stations)) {
        stations = route.stations;
    }
    return { ...route, stations };
};
const parseTrain = (train) => {
    let stoppages = [];
    if (train.stoppages && typeof train.stoppages === 'string') {
        try {
            stoppages = JSON.parse(train.stoppages);
        }
        catch (e) {
            console.error(`Failed to parse stoppages for train ${train.id}:`, e);
        }
    }
    else if (Array.isArray(train.stoppages)) {
        stoppages = train.stoppages;
    }
    return { ...train, stoppages };
};
// === DASHBOARD STATS ===
router.get("/dashboard/stats", async (req, res) => {
    try {
        // --- 1. Get all counts in parallel ---
        const [totalUsersData, totalRoutesData, totalStationsData, totalTrainsData,] = await Promise.all([
            supabase.from("profiles").select("*", { count: "exact", head: true }),
            supabase.from("routes").select("*", { count: "exact", head: true }),
            supabase.from("stations").select("*", { count: "exact", head: true }),
            supabase.from("trains").select("*", { count: "exact", head: true }),
        ]);
        // --- 2. Get user registration data for the chart ---
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        sixMonthsAgo.setDate(1); // Start from the 1st of that month
        const { data: users, error: usersError } = await supabase
            .from("profiles")
            .select("created_at")
            .gt("created_at", sixMonthsAgo.toISOString());
        if (usersError)
            throw usersError;
        // --- 3. Process data in JavaScript (MODIFIED FOR DAILY) ---
        const counts = new Map();
        const today = new Date();
        // Initialize map with all days from 6 months ago to today
        for (let d = new Date(sixMonthsAgo); d <= today; d.setDate(d.getDate() + 1)) {
            const key = d.toISOString().split("T")[0]; // "YYYY-MM-DD"
            counts.set(key, 0);
        }
        // Aggregate user signups by day
        if (users) {
            for (const user of users) {
                // Get "YYYY-MM-DD" from the user's timestamp
                const key = new Date(user.created_at).toISOString().split("T")[0];
                if (counts.has(key)) {
                    counts.set(key, counts.get(key) + 1);
                }
            }
        }
        // Format for chart, matching new ChartDataEntry type
        const chartData = Array.from(counts.entries()).map(([date, count]) => ({
            date: date, // "YYYY-MM-DD"
            registrationCount: count,
        }));
        // --- 4. Consolidate all stats ---
        const stats = {
            totalUsers: totalUsersData.count ?? 0,
            totalRoutes: totalRoutesData.count ?? 0,
            totalStations: totalStationsData.count ?? 0,
            totalTrains: totalTrainsData.count ?? 0,
            chartData: chartData,
        };
        res.json(stats);
    }
    catch (error) {
        console.error("Error fetching dashboard stats:", error);
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: "An unknown error occurred" });
        }
    }
});
// === LIVE STATUS API ===
router.post('/status/update', async (req, res) => {
    const { train_id, date, lap_completed, arrivals, last_completed_station_id } = req.body;
    const { data, error } = await supabase
        .from('daily_status')
        .upsert({
        train_id,
        date,
        lap_completed,
        arrivals,
        last_completed_station_id,
    }, {
        onConflict: 'train_id, date',
    })
        .select()
        .single();
    if (error) {
        console.error('Supabase upsert error:', error);
        return res.status(500).json({ error: error.message });
    }
    // This route is fine, it already parses 'arrivals'
    if (data && data.arrivals && typeof data.arrivals === 'string') {
        try {
            data.arrivals = JSON.parse(data.arrivals);
        }
        catch (e) {
            data.arrivals = [];
        }
    }
    else if (data && !data.arrivals) {
        data.arrivals = [];
    }
    res.json(data);
});
// =================================================================
// --- STATION ROUTES ---
// =================================================================
// CREATE a new station
router.post('/stations', async (req, res) => {
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
    if (error)
        return res.status(500).json({ error: error.message });
    res.status(201).json(data); // This is fine, no JSON fields
});
// UPDATE an existing station
router.put('/stations/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body; // Frontend already sends snake_case for updates
    const { data, error } = await supabase
        .from('stations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data); // This is fine, no JSON fields
});
// DELETE a station
// ... (your existing delete station route is fine) ...
router.delete('/stations/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase
        .from('stations')
        .delete()
        .eq('id', id);
    if (error)
        return res.status(500).json({ error: error.message });
    res.status(204).send(); // 204 No Content
});
// =================================================================
// --- ROUTE ROUTES ---
// =================================================================
// CREATE a new route
router.post('/routes', async (req, res) => {
    const { name, stations } = req.body;
    const { data, error } = await supabase
        .from('routes')
        .insert({ name, stations }) // Body matches table structure
        .select()
        .single();
    if (error)
        return res.status(500).json({ error: error.message });
    // FIX: Parse the response before sending
    res.status(201).json(parseRoute(data));
});
// UPDATE an existing route
router.put('/routes/:id', async (req, res) => {
    const { id } = req.params;
    const { name, stations } = req.body; // Body matches table structure
    const { data, error } = await supabase
        .from('routes')
        .update({ name, stations })
        .eq('id', id)
        .select()
        .single();
    if (error)
        return res.status(500).json({ error: error.message });
    // FIX: Parse the response before sending
    res.json(parseRoute(data));
});
// DELETE a route
// ... (your existing delete route is fine) ...
router.delete('/routes/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase
        .from('routes')
        .delete()
        .eq('id', id);
    if (error)
        return res.status(500).json({ error: error.message });
    res.status(204).send(); // 204 No Content
});
// =================================================================
// --- TRAIN ROUTES ---
// =================================================================
// CREATE a new train
router.post('/trains', async (req, res) => {
    const { name, code, direction, route_id, stoppages } = req.body;
    const { data, error } = await supabase
        .from('trains')
        .insert({ name, code, direction, route_id, stoppages })
        .select()
        .single();
    if (error)
        return res.status(500).json({ error: error.message });
    // FIX: Parse the response before sending
    res.status(201).json(parseTrain(data));
});
// UPDATE an existing train
router.put('/trains/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body; // Frontend sends partial data matching table
    const { data, error } = await supabase
        .from('trains')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error)
        return res.status(500).json({ error: error.message });
    // FIX: Parse the response before sending
    res.json(parseTrain(data));
});
// DELETE a train
// ... (your existing delete train route is fine) ...
router.delete('/trains/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase
        .from('trains')
        .delete()
        .eq('id', id);
    if (error)
        return res.status(500).json({ error: error.message });
    res.status(204).send(); // 204 No Content
});
// =================================================================
// --- FEEDBACK ROUTES (ADMIN) ---
// =================================================================
router.get('/feedback', async (req, res) => {
    try {
        const { page = 1, filter = 'all' } = req.query;
        // FIX: Ensure 'search' is a string
        let search;
        if (typeof req.query.search === 'string') {
            search = req.query.search;
        }
        else {
            search = ''; // Default to empty string if not provided, undefined, or is an array
        }
        const limit = 15;
        const from = (Number(page) - 1) * limit;
        const to = from + limit - 1;
        let query = supabase
            .from('feedback')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);
        // --- SEARCH ---
        if (search) {
            query = query.or(`message.ilike.%${search}%,reason.ilike.%${search}%,email.ilike.%${search}%`);
        }
        // --- TIME FILTER ---
        if (filter !== 'all') {
            const now = new Date();
            let filterDate = new Date();
            switch (filter) {
                case 'today':
                    filterDate.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    filterDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    filterDate.setMonth(now.getMonth() - 1);
                    break;
            }
            if (filter !== 'all') {
                query = query.gte('created_at', filterDate.toISOString());
            }
        }
        const { data, count, error } = await query;
        if (error)
            throw error;
        res.json({ data, count, page: Number(page), limit });
    }
    catch (error) {
        console.error("Error fetching feedback:", error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
});
// OPTIONAL: Mark feedback as read/archived
router.patch('/feedback/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const { data, error } = await supabase
        .from('feedback')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
});
export default router;
//# sourceMappingURL=adminRoutes.js.map