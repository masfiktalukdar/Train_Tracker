import express from "express";
import env from "dotenv";
import cors from "cors";
// Import all your route handlers
import authenticationRoutes from "./routes/authenticationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
env.config();
const PORT = process.env.PORT || 3000;
const app = express();
// --- Middleware ---
app.use(cors());
app.use(express.json());
// --- Routes ---
// Use the correct base paths for your APIs
app.use('/api/auth', authenticationRoutes); // For login/register
app.use('/api/admin', adminRoutes); // For secured admin actions (needs auth middleware)
app.use('/api/public', publicRoutes); // For public data
app.use("/health", (req, res) => {
    res.send({ message: "Backend running successfully", status: 200 });
});
app.listen(PORT, () => {
    console.log(`app is running on ${PORT}`);
});
//# sourceMappingURL=server.js.map