import { Request, Response, NextFunction } from "express";

/**
 * Session guard matching the pattern already set by the Google OAuth
 * callback (req.session.isLoggedIn / req.session.teacherId). If you
 * already have an equivalent middleware for your other teacher routes
 * (Academic Email, LinkedIn Post, etc.), use that instead of this one —
 * don't run two different session checks side by side.
 */
export function protectTeacher(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.isLoggedIn || !req.session?.teacherId) {
    return res.status(401).json({ success: false, message: "Not authenticated." });
  }
  next();
}