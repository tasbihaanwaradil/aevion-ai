// server/controllers/LinkedInPostControllers.ts

import { Request, Response } from "express";
import axios from "axios";
import LinkedInPost from "../models/LinkedInPost.js";
import { generateLinkedInPostAgent } from "../services/LinkedinAgent.js";

// ─── POST /api/linkedin-posts/generate ───────────────────────────────────────
export const generateLinkedInPost = async (req: Request, res: Response) => {
  try {
    const { userId } = req.session as any;
    const { topic, postType, tone } = req.body;

    if (!topic?.trim() || !postType || !tone) {
      return res.status(400).json({
        success: false,
        message: "Topic, post type, and tone are all required.",
      });
    }

    const result = await generateLinkedInPostAgent({ topic, postType, tone });

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }

    const postDoc = await LinkedInPost.create({
      userId,
      topic,
      postType,
      tone,
      content: result.post,
      status: "draft",
      isGenerating: false,
    });

    return res.json({ success: true, post: result.post, postId: postDoc._id });
  } catch (error: any) {
    console.error("[generateLinkedInPost]", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PATCH /api/linkedin-posts/:id/approve ───────────────────────────────────
export const approvePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const post = await LinkedInPost.findByIdAndUpdate(
      id,
      { content, status: "approved" },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    return res.json({ success: true, post });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/linkedin-posts/history ─────────────────────────────────────────
export const getPostHistory = async (req: Request, res: Response) => {
  try {
    const { userId } = req.session as any;
    const posts = await LinkedInPost
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(20);
    return res.json({ success: true, posts });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/linkedin-posts/publish ────────────────────────────────────────
export const publishToLinkedIn = async (req: Request, res: Response) => {
  try {
    const session = req.session as any;

    // Guard 1: LinkedIn must be connected
    if (!session.linkedInAccessToken || !session.linkedInSub) {
      return res.status(401).json({
        success: false,
        message: "LinkedIn not connected. Please connect your LinkedIn account first.",
        requiresAuth: true,
      });
    }

    // Guard 2: Token must not be expired
    if (Date.now() > session.linkedInTokenExpiresAt) {
      delete session.linkedInAccessToken;
      return res.status(401).json({
        success: false,
        message: "LinkedIn session expired. Please reconnect.",
        requiresAuth: true,
      });
    }

    const { content, postId } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Post content cannot be empty.",
      });
    }

    // Doc 2: POST to LinkedIn ugcPosts API
    // author = urn:li:person:{sub}  — sub from Doc 1 userinfo stored in session
    // X-Restli-Protocol-Version: 2.0.0 is mandatory per Doc 2
    const linkedInResponse = await axios.post(
      "https://api.linkedin.com/v2/ugcPosts",
      {
        author: `urn:li:person:${session.linkedInSub}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: content,
            },
            shareMediaCategory: "NONE",
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${session.linkedInAccessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
      }
    );

    // Doc 2: successful response is 201, post ID is in X-RestLi-Id header
    const linkedInPostId = linkedInResponse.headers["x-restli-id"];
    console.log(`[LinkedIn] Post published. Post ID: ${linkedInPostId}`);

    // Update DB record to posted
    if (postId) {
      await LinkedInPost.findByIdAndUpdate(postId, {
        content,
        status: "posted",
      });
    }

    return res.json({
      success: true,
      linkedInPostId,
      message: "Post published to LinkedIn successfully!",
    });
  } catch (err: any) {
    const liError = err?.response?.data;
    const status = err?.response?.status;
    console.error("[publishToLinkedIn error]", liError || err.message);

    // Token revoked or expired on LinkedIn side
    if (status === 401) {
      const session = req.session as any;
      delete session.linkedInAccessToken;
      return res.status(401).json({
        success: false,
        message: "LinkedIn access token expired. Please reconnect your account.",
        requiresAuth: true,
      });
    }

    if (liError?.message) {
      return res.status(500).json({
        success: false,
        message: `LinkedIn error: ${liError.message}`,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to publish to LinkedIn. Please try again.",
    });
  }
};