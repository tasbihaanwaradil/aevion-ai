import { Request, Response } from "express";
import LinkedInPost from "../models/LinkedInPost.js";
import { generateLinkedInPostAgent, AgentValidationError } from "../services/LinkedinAgent.js";
import { validateTopic } from "../utils/validateTopic.js";

export const generateLinkedInPost = async (req: Request, res: Response) => {
  try {
    const { userId } = req.session;
    const { topic, targetAudience, tone } = req.body;

    if (!topic || !targetAudience || !tone)
      return res.status(400).json({ success: false, message: "All fields are required." });

    const validation = validateTopic(topic);
    if (!validation.valid)
      return res.status(400).json({ success: false, message: validation.reason });

    const validAudiences = ["Professionals", "Entrepreneurs", "Students", "Developers"];
    const validTones = ["Professional", "Casual", "Inspirational", "Informative"];

    if (!validAudiences.includes(targetAudience))
      return res.status(400).json({ success: false, message: "Invalid targetAudience value." });

    if (!validTones.includes(tone))
      return res.status(400).json({ success: false, message: "Invalid tone value." });

    const postDoc = await LinkedInPost.create({
      userId,
      topic,
      content: "",
      targetAudience,
      tone,
      isGenerating: true,
    });

    const generatedText = await generateLinkedInPostAgent({ topic, targetAudience, tone });

    postDoc.content = generatedText;
    postDoc.isGenerating = false;
    await postDoc.save();

    return res.json({ success: true, postId: postDoc._id, post: generatedText });

  } catch (error: any) {
    console.error("[generateLinkedInPost]", error);
    if (error instanceof AgentValidationError)
      return res.status(400).json({ success: false, message: error.message });
    return res.status(500).json({ success: false, message: "Failed to generate post. Please try again." });
  }
};

export const approveLinkedInPost = async (req: Request, res: Response) => {
  try {
    const { userId } = req.session;
    const { id } = req.params;
    const { editedContent } = req.body;

    const postDoc = await LinkedInPost.findOne({ _id: id, userId });
    if (!postDoc)
      return res.status(404).json({ success: false, message: "Post not found." });

    if (editedContent && typeof editedContent === "string" && editedContent.trim().length > 0)
      postDoc.content = editedContent.trim();

    await postDoc.save();
    return res.json({ success: true, post: postDoc.content });

  } catch (error: any) {
    console.error("[approveLinkedInPost]", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getLinkedInShareUrl = async (req: Request, res: Response) => {
  try {
    const { content } = req.query;
    if (!content || typeof content !== "string")
      return res.status(400).json({ success: false, message: "Content is required." });

    const encodedContent = encodeURIComponent(content.slice(0, 3000));
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?text=${encodedContent}`;
    return res.json({ success: true, shareUrl });

  } catch (error: any) {
    console.error("[getLinkedInShareUrl]", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getPostHistory = async (req: Request, res: Response) => {
  try {
    const { userId } = req.session;
    const posts = await LinkedInPost.find({ userId, isGenerating: false })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("topic targetAudience tone content createdAt");
    return res.json({ success: true, posts });

  } catch (error: any) {
    console.error("[getPostHistory]", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};