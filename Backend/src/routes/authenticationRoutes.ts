import { Router } from "express";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import supabase from "../config/supabaseClient.js";

const router = Router();

// --- User Registration ---
router.post('/register', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  // 1. Create the user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    return res.status(400).json({ error: authError.message });
  }

  if (!authData.user) {
    return res.status(500).json({ error: 'User could not be created.' });
  }
  res.status(201).json({ message: 'User registered. Please check your email to verify.' });
});


// --- User & Admin Login ---
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  // 1. Authenticate user with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (authError) {
    return res.status(400).json({ error: authError.message });
  }
  if (!authData.user) {
    return res.status(400).json({ error: 'Login failed, user data not found.' });
  }
  // 2. Fetch the user's profile to get their role
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .single();
  if (profileError || !profileData) {
    return res.status(404).json({ error: 'User profile not found.' });
  }
  // Check for the JWT secret before using it
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables.');
    return res.status(500).json({ error: 'Internal server error: Server is not configured correctly.' });
  }

  // 3. Create a JWT
  const token = jwt.sign(
    {
      id: authData.user.id,
      email: authData.user.email,
      role: profileData.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '1d' } 
  );
  res.json({
    message: 'Login successful',
    token,
    user: {
      id: authData.user.id,
      email: authData.user.email,
      role: profileData.role
    }
  });
});

export default router;
