// server/routes/linkedInAuthRoutes.ts

import { Router, Request, Response } from "express";
import axios from "axios";

const router = Router();

// ─── ROUTE 1: Start OAuth ─────────────────────────────────────────────────────
router.get("/login", (req: Request, res: Response) => {
  // If already connected and token not expired, skip OAuth entirely
  if (
    req.session.linkedInAccessToken &&
    req.session.linkedInTokenExpiresAt &&
    Date.now() < req.session.linkedInTokenExpiresAt
  ) {
    console.log("[LinkedIn OAuth] Already connected, skipping login");
    return res.redirect(
      `${process.env.FRONTEND_URL}/generate?linkedin=connected`
    );
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    redirect_uri: process.env.LINKEDIN_REDIRECT_URI!,
    scope: "openid profile email w_member_social",
    state: "linkedin_csrf_state_123",
  });

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  console.log("[LinkedIn Login] Redirecting to LinkedIn OAuth");
  res.redirect(authUrl);
});

// ─── ROUTE 2: OAuth Callback ──────────────────────────────────────────────────
router.get("/callback", async (req: Request, res: Response) => {
  const { code, state, error } = req.query;

  // LinkedIn denied access
  if (error) {
    console.error("[LinkedIn OAuth] Access denied:", error);
    return res.redirect(
      `${process.env.FRONTEND_URL}/generate?linkedin=denied`
    );
  }

  // Basic CSRF check
  if (state !== "linkedin_csrf_state_123") {
    console.error("[LinkedIn OAuth] Invalid state parameter");
    return res.status(400).json({ message: "Invalid state parameter" });
  }

  // No code returned
  if (!code) {
    console.error("[LinkedIn OAuth] No code in callback");
    return res.redirect(`${process.env.FRONTEND_URL}/generate?linkedin=error`);
  }

  // Guard: already connected with valid token — skip exchange to avoid 429
  if (
    req.session.linkedInAccessToken &&
    req.session.linkedInTokenExpiresAt &&
    Date.now() < req.session.linkedInTokenExpiresAt
  ) {
    console.log("[LinkedIn OAuth] Token already exists, skipping exchange");
    return res.redirect(
      `${process.env.FRONTEND_URL}/generate?linkedin=connected`
    );
  }

  // Guard: this exact code was already used — prevents double-fire from
  // React Strict Mode or browser prefetch hitting the callback twice
  const callbackCode = code as string;
  if ((req.session as any).usedLinkedInCode === callbackCode) {
    console.log("[LinkedIn OAuth] Code already consumed, skipping");
    return res.redirect(
      `${process.env.FRONTEND_URL}/generate?linkedin=connected`
    );
  }

  // Mark code as used immediately before any async call
  (req.session as any).usedLinkedInCode = callbackCode;

  try {
    // Step A: Exchange authorization code for access token
    const tokenResponse = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      new URLSearchParams({
        grant_type: "authorization_code",
        code: callbackCode,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI!,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const accessToken: string = tokenResponse.data.access_token;
    const expiresIn: number = tokenResponse.data.expires_in;

    // Step B: Get Person URN (sub) from Doc 1 userinfo endpoint
    const userInfoResponse = await axios.get(
      "https://api.linkedin.com/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const { sub, name, picture, email } = userInfoResponse.data;

    // Step C: Save to session
    req.session.linkedInAccessToken = accessToken;
    req.session.linkedInSub = sub;
    req.session.linkedInName = name;
    req.session.linkedInPicture = picture || null;
    req.session.linkedInEmail = email || null;
    req.session.linkedInTokenExpiresAt = Date.now() + expiresIn * 1000;

    console.log(`[LinkedIn OAuth] Successfully connected: ${name} (sub: ${sub})`);

    return res.redirect(
      `${process.env.FRONTEND_URL}/generate?linkedin=connected`
    );
  } catch (err: any) {
    const status = err?.response?.status;
    const liError = err?.response?.data;

    console.error("[LinkedIn OAuth callback error]", liError || err.message);

    // Clear the used code flag so professor can retry
    delete (req.session as any).usedLinkedInCode;

    // 429: LinkedIn rate limiting — too many token exchange attempts
    if (status === 429) {
      console.error(
        "[LinkedIn OAuth] Rate limited. Too many token exchange attempts."
      );
      return res.redirect(
        `${process.env.FRONTEND_URL}/generate?linkedin=ratelimit`
      );
    }

    return res.redirect(`${process.env.FRONTEND_URL}/generate?linkedin=error`);
  }
});

// ─── ROUTE 3: Check connection status ─────────────────────────────────────────
router.get("/status", (req: Request, res: Response) => {
  if (!req.session.linkedInAccessToken) {
    return res.json({ connected: false });
  }

  if (
    req.session.linkedInTokenExpiresAt &&
    Date.now() > req.session.linkedInTokenExpiresAt
  ) {
    // Token expired — clean up session
    delete req.session.linkedInAccessToken;
    delete req.session.linkedInSub;
    delete req.session.linkedInName;
    delete req.session.linkedInPicture;
    delete req.session.linkedInEmail;
    delete req.session.linkedInTokenExpiresAt;
    return res.json({ connected: false, reason: "expired" });
  }

  res.json({
    connected: true,
    name: req.session.linkedInName,
    picture: req.session.linkedInPicture,
    email: req.session.linkedInEmail,
  });
});

// ─── ROUTE 4: Disconnect ──────────────────────────────────────────────────────
router.get("/disconnect", (req: Request, res: Response) => {
  delete req.session.linkedInAccessToken;
  delete req.session.linkedInSub;
  delete req.session.linkedInName;
  delete req.session.linkedInPicture;
  delete req.session.linkedInEmail;
  delete req.session.linkedInTokenExpiresAt;
  delete (req.session as any).usedLinkedInCode;
  res.json({ success: true });
});

export default router;