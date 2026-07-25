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
import AcademicEmailRoutes from"./routes/AcademicEmailRoutes.js";
import quizRoutes from "./routes/quiz.js";
import TeacherAuthRouter from './routes/TeacherAuthRoutes.js';

import passport from "./configs/passport.js";
import linkedinPostRoutes from "./routes/linkedInPostRoutes.js";


declare module 'express-session' {
    interface SessionData {
        isLoggedIn: boolean;
        userId: string
        teacherId: string
    }
}

await connectDB();

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}))

app.use(session({
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }, // this cookie will expire in 7 days
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI as string,
        collectionName: 'sessions'
    })
}))

// Initialize passport AFTER session
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json())

app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});

app.use('/api/auth', AuthRouter);
app.use("/api/user", userRoutes);
app.use("/api/linkedin-posts", linkedinPostRoutes);
app.use("/api/academic-email", AcademicEmailRoutes);
app.use("/api/quiz", quizRoutes);
app.use('/api/teacher-auth', TeacherAuthRouter);

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
