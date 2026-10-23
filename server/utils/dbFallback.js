const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Known password hash for "Password@123"
const DEFAULT_HASH = '$2a$10$w8T9/p/p6dK3YwOqE8Qh.OSgK/V6Uj3u.hW2YtI8x7BqC8mZ1N2Oq';

const defaultUsers = [
  {
    _id: "demo_admin_id_001",
    name: "Campus Placement Admin",
    email: "admin@placement.edu",
    password: DEFAULT_HASH,
    role: "admin",
    approvalStatus: "approved",
    approved: true,
    verified: true,
    profileComplete: true,
    createdAt: new Date().toISOString()
  },
  {
    _id: "demo_company_id_002",
    name: "Google Recruitment Team",
    email: "careers@google.com",
    password: DEFAULT_HASH,
    role: "company",
    approvalStatus: "approved",
    approved: true,
    verified: true,
    profileComplete: true,
    createdAt: new Date().toISOString()
  },
  {
    _id: "demo_student_id_003",
    name: "Aarav Sharma",
    email: "aarav.sharma@placement.edu",
    enrollmentNumber: "STU2024001",
    password: DEFAULT_HASH,
    role: "student",
    approvalStatus: "approved",
    approved: true,
    verified: true,
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
      skills: {
        technical: ["Python", "JavaScript", "React", "Node.js", "MongoDB", "Data Structures"]
      }
    },
    createdAt: new Date().toISOString()
  }
];

const defaultJobs = [
  {
    _id: "demo_job_001",
    title: "Software Engineer - Full Stack",
    company: "Google",
    location: "Bengaluru / Hyderabad",
    salary: "18 - 24 LPA",
    positions: 5,
    eligibility: "B.Tech CSE/IT, CGPA >= 8.0",
    skills: ["Data Structures", "Algorithms", "Java", "Python", "System Design"],
    description: "Join Google engineering to build scalable distributed cloud services.",
    jobStatus: "approved",
    createdAt: new Date().toISOString()
  },
  {
    _id: "demo_job_002",
    title: "Cloud Solutions Associate",
    company: "Microsoft",
    location: "Bengaluru / Noida",
    salary: "16 - 20 LPA",
    positions: 8,
    eligibility: "B.Tech Circuit Branches, CGPA >= 7.5",
    skills: ["Azure", "Cloud Architecture", "C# / Python", "Networking"],
    description: "Build cutting-edge Azure architectures and enterprise solutions.",
    jobStatus: "approved",
    createdAt: new Date().toISOString()
  },
  {
    _id: "demo_job_003",
    title: "Frontend Developer",
    company: "InnovateTech Labs",
    location: "Pune / Remote",
    salary: "10 - 14 LPA",
    positions: 4,
    eligibility: "B.Tech Any Branch, CGPA >= 7.0",
    skills: ["React", "TypeScript", "HTML5", "CSS3", "REST APIs"],
    description: "Craft modern user interfaces using React, Next.js, and CSS3.",
    jobStatus: "approved",
    createdAt: new Date().toISOString()
  }
];

let inMemoryUsers = [...defaultUsers];
let inMemoryJobs = [...defaultJobs];
let inMemoryApplications = [];

function decorateUser(u) {
  if (!u) return null;
  const userObj = { ...u };
  userObj.getPublicProfile = function () {
    const copy = { ...this };
    delete copy.password;
    return copy;
  };
  userObj.getProfileCompletionPercentage = function () {
    return 100;
  };
  userObj.getProfileCompletionStatus = function () {
    return {
      contactInfo: { completed: true, fields: { mobileNumber: true, alternateEmail: true } },
      basicInfo: { completed: true, fields: { fullName: true, dateOfBirth: true, bio: true, profilePicture: true } },
      academicInfo: { completed: true, fields: { currentDegree: true, institution: true, cgpa: true } },
      skills: { completed: true, count: 5 },
      documents: { completed: true, fields: { resume: true, experience: true } }
    };
  };
  userObj.save = async function () {
    return this;
  };
  return userObj;
}

function findUser({ email, enrollmentNumber, id, _id }) {
  const normEmail = email ? String(email).trim().toLowerCase() : null;
  const normEnrollment = enrollmentNumber ? String(enrollmentNumber).trim().toUpperCase() : null;
  const targetId = id || _id;

  const found = inMemoryUsers.find(u => {
    if (normEmail && u.email.toLowerCase() === normEmail) return true;
    if (normEnrollment && u.enrollmentNumber && u.enrollmentNumber.toUpperCase() === normEnrollment) return true;
    if (targetId && String(u._id) === String(targetId)) return true;
    return false;
  });

  return decorateUser(found);
}

function findUserById(id) {
  return findUser({ id });
}

function createUser(payload) {
  const newUser = {
    _id: "user_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    ...payload,
    createdAt: new Date().toISOString()
  };
  inMemoryUsers.push(newUser);
  return decorateUser(newUser);
}

function getAllUsers() {
  return inMemoryUsers.map(decorateUser);
}

function getFallbackJobs() {
  return inMemoryJobs;
}

function createFallbackJob(payload) {
  const newJob = {
    _id: "job_" + Date.now(),
    ...payload,
    jobStatus: "approved",
    createdAt: new Date().toISOString()
  };
  inMemoryJobs.unshift(newJob);
  return newJob;
}

function getFallbackApplications(filter = {}) {
  return inMemoryApplications;
}

function createFallbackApplication(payload) {
  const newApp = {
    _id: "app_" + Date.now(),
    ...payload,
    status: "applied",
    createdAt: new Date().toISOString()
  };
  inMemoryApplications.unshift(newApp);
  return newApp;
}

module.exports = {
  findUser,
  findUserById,
  createUser,
  getAllUsers,
  getFallbackJobs,
  createFallbackJob,
  getFallbackApplications,
  createFallbackApplication,
  decorateUser
};
