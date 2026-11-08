// import type { Request, Response } from "express";
// import Contact from "../models/Contact.js";

// const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// export const submitContact = async (req: Request, res: Response) => {
//   try {
//     const name = String(req.body?.name ?? "").trim();
//     const email = String(req.body?.email ?? "").trim();
//     const message = String(req.body?.message ?? "").trim();

//     // Same rules as the client, enforced again on the server.
//     if (name.length < 2 || name.length > 100) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Enter your full name." });
//     }

//     if (!EMAIL_RE.test(email) || email.length > 254) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Enter a valid email address." });
//     }

//     if (message.length < 10 || message.length > 5000) {
//       return res.status(400).json({
//         success: false,
//         message: "Message must be between 10 and 5000 characters.",
//       });
//     }

//     await Contact.create({ name, email, message });

//     return res.status(201).json({
//       success: true,
//       message: "Message received.",
//     });
//   } catch (error) {
//     console.error("Contact submit error:", error);
//     return res
//       .status(500)
//       .json({ success: false, message: "Something went wrong." });
//   }
// };