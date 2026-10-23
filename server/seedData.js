const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
require("dotenv").config({ path: path.join(__dirname, ".env"), override: true });

const User = require("./models/User");
const Job = require("./models/job");
const Application = require("./models/Application");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/placement_portal";

async function seed() {
  try {
    console.log("Connecting to MongoDB:", MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully. Seeding initial data...");

    // Clear existing data
    await User.deleteMany({});
    await Job.deleteMany({});
    await Application.deleteMany({});

    const passwordHash = await bcrypt.hash("Password@123", 10);

    // 1. Create Admin
    const admin = await User.create({
      name: "Campus Placement Admin",
      email: "admin@placement.edu",
      password: passwordHash,
      role: "admin",
      verified: true,
      approved: true,
      approvalStatus: "approved",
      profileComplete: true
    });
    console.log("Created Admin:", admin.email);

    // 2. Create Company Users
    const googleRecruiter = await User.create({
      name: "Google Recruitment Team",
      email: "careers@google.com",
      password: passwordHash,
      role: "company",
      verified: true,
      approved: true,
      approvalStatus: "approved",
      profileComplete: true
    });

    const msRecruiter = await User.create({
      name: "Microsoft Talent Acquisition",
      email: "recruiter@microsoft.com",
      password: passwordHash,
      role: "company",
      verified: true,
      approved: true,
      approvalStatus: "approved",
      profileComplete: true
    });

    // 3. Create Students
    const student1 = await User.create({
      name: "Aarav Sharma",
      email: "aarav.sharma@placement.edu",
      password: passwordHash,
      role: "student",
      enrollmentNumber: "STU2024001",
      verified: true,
      approved: true,
      approvalStatus: "approved",
      placed: true,
      profileComplete: true,
      profile: {
        basicInfo: {
          fullName: "Aarav Sharma",
          institution: "Institute of Technology",
          department: "Computer Science and Engineering",
          degree: "B.Tech",
          graduationYear: 2026,
          cgpa: "8.9"
        },
        contactInfo: {
          phone: "+91 9876543210",
          linkedin: "https://linkedin.com/in/aaravsharma",
          github: "https://github.com/aaravsharma"
        },
        academic: {
          skills: {
            technical: ["Python", "JavaScript", "React", "Node.js", "MongoDB", "Data Structures"],
            soft: ["Leadership", "Communication", "Problem Solving"],
            languages: ["English", "Hindi"]
          },
          projects: [
            { title: "Placement Portal System", description: "Full stack MERN portal with real-time updates" },
            { title: "AI Resume Screener", description: "NLP-based resume classification pipeline" }
          ]
        }
      }
    });

    const student2 = await User.create({
      name: "Priya Patel",
      email: "priya.patel@placement.edu",
      password: passwordHash,
      role: "student",
      enrollmentNumber: "STU2024002",
      verified: true,
      approved: true,
      approvalStatus: "approved",
      placed: false,
      profileComplete: true,
      profile: {
        basicInfo: {
          fullName: "Priya Patel",
          institution: "Institute of Technology",
          department: "Information Technology",
          degree: "B.Tech",
          graduationYear: 2026,
          cgpa: "8.4"
        },
        contactInfo: {
          phone: "+91 9876543211",
          linkedin: "https://linkedin.com/in/priyapatel",
          github: "https://github.com/priyapatel"
        },
        academic: {
          skills: {
            technical: ["Java", "Spring Boot", "SQL", "Cloud Computing", "Docker"],
            soft: ["Teamwork", "Adaptability"],
            languages: ["English", "Gujarati"]
          },
          projects: [
            { title: "E-Commerce Microservices", description: "Spring Boot microservices architecture" }
          ]
        }
      }
    });

    const student3 = await User.create({
      name: "Rohan Gupta",
      email: "rohan.gupta@placement.edu",
      password: passwordHash,
      role: "student",
      enrollmentNumber: "STU2024003",
      verified: true,
      approved: true,
      approvalStatus: "approved",
      placed: true,
      profileComplete: true,
      profile: {
        basicInfo: {
          fullName: "Rohan Gupta",
          institution: "Institute of Technology",
          department: "Electronics and Communication",
          degree: "B.Tech",
          graduationYear: 2026,
          cgpa: "7.8"
        },
        contactInfo: {
          phone: "+91 9876543212",
          linkedin: "https://linkedin.com/in/rohangupta",
          github: "https://github.com/rohangupta"
        },
        academic: {
          skills: {
            technical: ["C++", "Embedded Systems", "IoT", "Python"],
            soft: ["Time Management", "Analytical Thinking"],
            languages: ["English", "Hindi"]
          }
        }
      }
    });

    console.log("Created 3 Students");

    // 4. Create Jobs
    const job1 = await Job.create({
      title: "Software Engineer - Full Stack",
      company: "Google",
      description: "Join Google engineering to build scalable distributed systems and cloud platforms.",
      location: "Bengaluru / Hyderabad",
      salary: "18 - 24 LPA",
      positions: 5,
      eligibility: "B.Tech CSE/IT, CGPA >= 8.0, No active backlogs",
      skills: ["Data Structures", "Algorithms", "Java", "Python", "System Design"],
      createdBy: googleRecruiter._id
    });

    const job2 = await Job.create({
      title: "Cloud Solutions Associate",
      company: "Microsoft",
      description: "Build cutting edge Azure solutions and modernize enterprise applications.",
      location: "Bengaluru / Noida",
      salary: "16 - 20 LPA",
      positions: 8,
      eligibility: "B.Tech Any Circuit Branch, CGPA >= 7.5",
      skills: ["Azure", "Cloud Architecture", "C# / Python", "Networking"],
      createdBy: msRecruiter._id
    });

    const job3 = await Job.create({
      title: "Frontend Developer",
      company: "InnovateTech Labs",
      description: "Create responsive user experiences using React, Next.js, and TypeScript.",
      location: "Pune / Remote",
      salary: "10 - 14 LPA",
      positions: 4,
      eligibility: "B.Tech Any Branch, CGPA >= 7.0",
      skills: ["React", "TypeScript", "HTML5", "CSS3", "REST APIs"],
      createdBy: googleRecruiter._id
    });

    console.log("Created 3 Job Openings");

    // 5. Create Applications
    await Application.create({
      job: job1._id,
      student: student1._id,
      status: "selected"
    });

    await Application.create({
      job: job2._id,
      student: student2._id,
      status: "shortlisted"
    });

    await Application.create({
      job: job3._id,
      student: student3._id,
      status: "selected"
    });

    console.log("Created 3 Applications");
    console.log("\n=======================================================");
    console.log("✅ Seed completed successfully!");
    console.log("Default accounts created (Password for all: Password@123):");
    console.log("- Admin:    admin@placement.edu");
    console.log("- Recruiter: careers@google.com");
    console.log("- Student:  aarav.sharma@placement.edu");
    console.log("- Student:  priya.patel@placement.edu");
    console.log("- Student:  rohan.gupta@placement.edu");
    console.log("=======================================================\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

seed();
