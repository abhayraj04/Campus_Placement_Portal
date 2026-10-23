const Job = require("../models/job");
const User = require("../models/User");
const { sendMail, wrapHtmlEmail } = require("../utils/mailer");
const { getCache, setCache, clearCache } = require("../utils/cache");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const JOBS_CACHE_KEY = 'jobs:approved';

exports.createJob = async (req, res) => {
  try {
    const { title, location, description, salary, positions, eligibility, experience, skills } = req.body;

    if (!title || !location || !description) {
      return res.status(400).json({ message: "Title, location, and description are required" });
    }

    const companyUser = await User.findById(req.user?.id);
    if (!companyUser || companyUser.role !== "company") {
      return res.status(403).json({ message: "Only approved companies can post jobs" });
    }

    if (companyUser.approvalStatus !== "approved") {
      return res.status(403).json({ message: "Your company account needs admin approval before posting jobs" });
    }

    const job = await Job.create({
      title,
      company: companyUser.name || companyUser.email,
      description,
      location,
      salary: salary || null,
      positions: positions ? Number(positions) : 1,
      eligibility: eligibility || null,
      experience: experience || null,
      skills: typeof skills === "string"
        ? skills.split(",").map(s => s.trim()).filter(Boolean)
        : Array.isArray(skills) ? skills : [],
      createdBy: companyUser._id,
      jobStatus: "pending"
    });

    clearCache(JOBS_CACHE_KEY);

    try {
      const companyEmailHtml = wrapHtmlEmail('Job Posted Successfully', `
        <p>Hi ${companyUser.name || 'Recruiter'},</p>
        <p>Your job post <strong>${job.title}</strong> has been created successfully and is pending admin approval.</p>
        <p>Once approved, it will be visible to students on the portal.</p>
      `);
      await sendMail({ to: companyUser.email, subject: 'Job Posted and Pending Approval', html: companyEmailHtml });
    } catch (err) {
      console.warn('Failed to send job creation confirmation to company', err.message);
    }

    if (ADMIN_EMAIL) {
      try {
        const html = wrapHtmlEmail('Pending Job Approval', `
          <p>A new job has been posted and requires admin approval:</p>
          <ul>
            <li><strong>Title:</strong> ${job.title}</li>
            <li><strong>Company:</strong> ${job.company}</li>
            <li><strong>Location:</strong> ${job.location}</li>
            <li><strong>Salary:</strong> ${job.salary || "Not specified"}</li>
            <li><strong>Eligibility:</strong> ${job.eligibility || "Not specified"}</li>
            <li><strong>Description:</strong> ${job.description}</li>
            <li><strong>Posted At:</strong> ${new Date(job.createdAt).toLocaleString()}</li>
          </ul>
        `);
        await sendMail({ to: ADMIN_EMAIL, subject: 'Pending Job Approval', html });
      } catch (err) {
        console.warn('Failed to send job approval notification to admin', err.message);
      }
    }

    res.status(201).json({
      message: "Job created successfully and is pending admin approval",
      job
    });

  } catch (error) {
    console.log("Create Job Error:", error.message);
    res.status(500).json({ message: "Error creating job" });
  }
};

exports.getJobs = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      const { getFallbackJobs } = require("../utils/dbFallback");
      return res.status(200).json(getFallbackJobs());
    }
    const query = req.user?.role === "student" ? { jobStatus: "approved" } : {};
    const cacheKey = req.user?.role === "student" ? JOBS_CACHE_KEY : null;

    if (cacheKey) {
      const cachedJobs = getCache(cacheKey);
      if (cachedJobs) {
        return res.status(200).json(cachedJobs);
      }
    }

    const jobs = await Job.find(query)
      .select("title company location salary positions eligibility experience skills createdAt createdBy")
      .populate("createdBy", "name email approvalStatus")
      .sort({ createdAt: -1 });

    if (cacheKey) {
      setCache(cacheKey, jobs, 30000);
    }

    res.status(200).json(jobs);

  } catch (error) {
    console.log("Get Jobs Error:", error.message);
    res.status(500).json({ message: "Error fetching jobs" });
  }
};
