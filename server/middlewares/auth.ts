import { Request, Response, NextFunction } from "express";

export const protectTeacher = async (req: Request, res: Response, next: NextFunction) => {
    const { isLoggedIn, teacherId } = req.session;

    if (!isLoggedIn || !teacherId) {
        return res.status(401).json({ message: 'You are not logged in' });
    }

    next();
};

export default protectTeacher;