import { Request, Response } from "express";
import LinkedInPost from "../models/LinkedInPost.js";
import { generateText } from "../utils/Llm.js";

export const regeneratePost = async (req: Request, res: Response) => {
  try {
    const { postId, feedback } = req.body;

    if (!postId) {
      return res.status(400).json({ message: "postId is required" });
    }

    const post = await LinkedInPost.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // 🔥 SAVE OLD VERSION
    post.versions?.push(post.content);

    const prompt = `
Improve the following LinkedIn post.

User Feedback:
${feedback || "Make it more engaging and specific."}

Original Post:
${post.content}

Rules:
- Improve clarity
- Make it less generic
- Keep structure
`;

    const newContent = await generateText(prompt);

    post.content = newContent;
    post.feedback = feedback;
    post.status = "review";

    await post.save();

    res.json({
      success: true,
      post: newContent,
      postId: post._id,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};