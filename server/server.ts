// server/server.ts

import dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']); 

import express, { Request, Response } from 'express';
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/db.js';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import AuthRouter from './routes/AuthRoutes.js';
import userRoutes from "./routes/UserRoutes.js";
import passport from "./configs/passport.js";
import linkedinPostRoutes from "./routes/linkedInPostRoutes.js";

declare module 'express-session' {
    interface SessionData {
        isLoggedIn: boolean;
        userId: string;
        // ── ADD: LinkedIn session fields ──────────────────────────────────────
        linkedInAccessToken: string;
        linkedInSub: string;
        linkedInName: string;
        linkedInPicture: string | null;
        linkedInEmail: string | null;
        linkedInTokenExpiresAt: number;
    }
}

await connectDB();

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
// ADD http://localhost:5173 keeps your existing origin
// credentials: true is already set — session cookie works correctly
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}))

// ─── Session ──────────────────────────────────────────────────────────────────
// Only change: maxAge extended to 60 days to match LinkedIn token lifetime
// Everything else (MongoStore, secret, resave) stays exactly the same
app.use(session({
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 60 }, // ← changed from 7 days to 60 days
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI as string,
        collectionName: 'sessions'
    })
}))

// ─── Passport ────────────────────────────────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

// ─── Body parser ─────────────────────────────────────────────────────────────
app.use(express.json())

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});

app.use('/api/auth', AuthRouter);
app.use("/api/user", userRoutes);
app.use("/api/linkedin-posts", linkedinPostRoutes);

// ─── Start ────────────────────────────────────────────────────────────────────
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});