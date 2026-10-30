const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");

// Public & Protected AI routes for campus placement intelligence
router.post("/chat", aiController.aiChat);
router.post("/resume-analyzer", aiController.aiAnalyzeResume);
router.post("/interview-prep", aiController.aiGenerateInterview);
router.post("/interview-evaluate", aiController.aiEvaluateInterview);
router.post("/job-match", aiController.aiJobMatch);

module.exports = router;
