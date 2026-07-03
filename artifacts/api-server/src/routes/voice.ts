import { Router, type IRouter } from "express";
import multer from "multer";
import { requireUser, attachUser } from "../lib/auth";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

router.post("/voice/transcribe", attachUser, requireUser, upload.single("audio"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "An audio file is required." });
    return;
  }

  res.status(501).json({
    error: "Voice transcription is not configured for this deployment.",
  });
});

export default router;
