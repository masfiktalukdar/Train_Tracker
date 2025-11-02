import express from "express";
import env from "dotenv"
import adminRoutes from "./routes/authenticationRoutes.js";

env.config();

const PORT = process.env.PORT || 3000;

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Use the admin routes
app.use('/api/admin', adminRoutes);

app.listen(PORT, () => {
    console.log(`app is running on ${PORT}`)
})
