import express from "express";
import env from "dotenv";
import cors from "cors"; 

// Import all your route handlers
import authenticationRoutes from "./routes/authenticationRoutes.ts";
import adminRoutes from "./routes/adminRoutes.ts";
import publicRoutes from "./routes/publicRoutes.ts";

env.config();

const PORT = process.env.PORT || 3000;

const app = express();

// --- Middleware ---
app.use(cors()); 
app.use(express.json());

// --- Routes ---
// Use the correct base paths for your APIs
app.use('/api/auth', authenticationRoutes); // For login/register
app.use('/api/admin', adminRoutes);     // For secured admin actions (needs auth middleware)
app.use('/api/public', publicRoutes);   // For public data

app.listen(PORT, () => {
    console.log(`app is running on ${PORT}`);
});