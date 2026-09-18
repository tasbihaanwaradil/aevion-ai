// controllers/LinkedInPostControllers.ts

import { Request, Response } from "express";
import LinkedInPost from "../models/LinkedInPost.js";
import { generateLinkedInPostAgent } from "../services/LinkedinAgent.js";

// POST /api/linkedin-posts/generate
export const generateLinkedInPost = async (req: Request, res: Response) => {
  try {
    const { teacherId } = req.session as any;

    if (!teacherId) {
      return res.status(401).json({ success: false, message: "You are not logged in." });
    }

    const { topic, postType, tone } = req.body;

    if (!topic?.trim() || !postType || !tone) {
      return res.status(400).json({
        success: false,
        message: "Topic, post type, and tone are all required.",
      });
    }

    // Run 3-agent pipeline
    const result = await generateLinkedInPostAgent({ topic, postType, tone });

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }

    // Save as draft
    const postDoc = await LinkedInPost.create({
      teacherId,
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

// PATCH /api/linkedin-posts/:id/approve
export const approvePost = async (req: Request, res: Response) => {
  try {
    const { teacherId } = req.session as any;

    if (!teacherId) {
      return res.status(401).json({ success: false, message: "You are not logged in." });
    }

    const { id } = req.params;
    const { content } = req.body; // professor may have edited content

    // Scope by teacherId too, so one teacher can't edit another's draft
    // by guessing an id.
    const post = await LinkedInPost.findOneAndUpdate(
      { _id: id, teacherId },
      { content, status: "approved" },
      { new: true }
    );

    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    return res.json({ success: true, post });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/linkedin-posts/history
export const getPostHistory = async (req: Request, res: Response) => {
  try {
    const { teacherId } = req.session as any;

    if (!teacherId) {
      return res.status(401).json({ success: false, message: "You are not logged in." });
    }

    const posts = await LinkedInPost.find({ teacherId }).sort({ createdAt: -1 }).limit(20);
    return res.json({ success: true, posts });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};