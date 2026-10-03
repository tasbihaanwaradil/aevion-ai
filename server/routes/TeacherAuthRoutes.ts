import express from 'express';
import passport from '../configs/passport.js'
import {
    registerTeacher,
    loginTeacher,
    logoutTeacher,
    verifyTeacher,
    requestPasswordReset,
    resetPassword
} from '../controllers/TeacherAuthController.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const TeacherAuthRouter = express.Router();

TeacherAuthRouter.post('/register', registerTeacher);
TeacherAuthRouter.post('/login', loginTeacher);
TeacherAuthRouter.post('/logout', logoutTeacher);
TeacherAuthRouter.get('/verify', verifyTeacher);
TeacherAuthRouter.post('/forgot-password', requestPasswordReset);
TeacherAuthRouter.post('/reset-password', resetPassword);

// ======================
// GOOGLE AUTH (teacher-specific strategy, see config/passport.ts)
// ======================
TeacherAuthRouter.get(
    '/google',
    passport.authenticate('google-teacher', { scope: ['profile', 'email'], session: false })
);

TeacherAuthRouter.get('/google/callback', (req, res, next) => {
    passport.authenticate(
        'google-teacher',
        { session: false },
        (err: any, teacher: any, info: any) => {
            if (err) {
                console.log(err);
                return res.redirect(`${FRONTEND_URL}/Teacherlogin?authStatus=error`);
            }

            if (!teacher) {
                // info?.message is 'notfound' | 'no_email'
                return res.redirect(`${FRONTEND_URL}/Teacherlogin?authStatus=notfound`);
            }

            req.session.regenerate((regenErr) => {
                if (regenErr) {
                    return res.redirect(`${FRONTEND_URL}/Teacherlogin?authStatus=error`);
                }

                req.session.isLoggedIn = true;
                req.session.teacherId = teacher._id;

                return res.redirect(`${FRONTEND_URL}/Dashboard`);
            });
        }
    )(req, res, next);
});

export default TeacherAuthRouter;