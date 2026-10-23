 const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["student", "admin", "company"],
      default: "student"
    },

    verified: {
      type: Boolean,
      default: false
    },
    approved: {
      type: Boolean,
      default: false
    },
    enrollmentNumber: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
      validate: {
        validator: function(v) {
          if (!v) return true;
          return /^(?=.*[A-Z])(?=.*\d)[A-Z0-9]{10}$/.test(v);
        },
        message: "Enrollment number must be exactly 10 uppercase alphanumeric characters, e.g. CVB2100001"
      }
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
    placed: {
      type: Boolean,
      default: false
    },
    profileComplete: {
      type: Boolean,
      default: false
    },

    profile: {
      mobileNumber: {
        type: String,
        default: null,
        match: /^[0-9]{10}$/,
        sparse: true
      },
      alternateEmail: {
        type: String,
        default: null,
        lowercase: true,
        sparse: true
      },
      phoneVerified: {
        type: Boolean,
        default: false
      },
      emailVerified: {
        type: Boolean,
        default: false
      },

      basicInfo: {
        fullName: {
          type: String,
          default: null
        },
        dateOfBirth: {
          type: Date,
          default: null
        },
        gender: {
          type: String,
          enum: ["Male", "Female", "Other", null],
          default: null
        },
        profilePicture: {
          type: String,
          default: null
        },
        bio: {
          type: String,
          default: null,
          maxlength: 500
        },
        currentCity: {
          type: String,
          default: null
        },
        permanentCity: {
          type: String,
          default: null
        }
      },

      academicInfo: {
        currentDegree: {
          type: String,
          enum: ["B.Tech", "M.Tech", "BCA", "MCA", "B.Sc", "M.Sc", null],
          default: null
        },
        specialization: {
          type: String,
          default: null
        },
        institution: {
          type: String,
          default: null
        },
        enrollmentYear: {
          type: Number,
          default: null
        },
        expectedGraduationYear: {
          type: Number,
          default: null
        },
        cgpa: {
          type: Number,
          default: null,
          min: 0,
          max: 10
        },
        board10: {
          type: String,
          default: null
        },
        percentage10: {
          type: Number,
          default: null,
          min: 0,
          max: 100
        },
        yearPassed10: {
          type: Number,
          default: null
        },
        board12: {
          type: String,
          default: null
        },
        percentage12: {
          type: Number,
          default: null,
          min: 0,
          max: 100
        },
        yearPassed12: {
          type: Number,
          default: null
        },
        diplomaDegree: {
          type: String,
          default: null
        },
        diplomaBranch: {
          type: String,
          default: null
        },
        diplomaCGPA: {
          type: Number,
          default: null,
          min: 0,
          max: 10
        },
        diplomaPassed: {
          type: Number,
          default: null
        },
        activeBacklogs: {
          type: Number,
          default: 0
        },
        totalBacklogs: {
          type: Number,
          default: 0
        }
      },

      skills: {
        technical: [
          {
            name: {
              type: String,
              required: true
            },
            proficiency: {
              type: String,
              enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
              default: "Intermediate"
            },
            yearsOfExperience: {
              type: Number,
              default: 0
            }
          }
        ],
        languages: [
          {
            language: {
              type: String,
              required: true
            },
            proficiency: {
              type: String,
              enum: ["Beginner", "Intermediate", "Advanced", "Native"],
              default: "Intermediate"
            }
          }
        ]
      },

      experience: {
        internships: [
          {
            company: String,
            position: String,
            duration: String,
            description: String,
            startDate: Date,
            endDate: Date,
            skills: [String]
          }
        ],
        workExperience: [
          {
            company: String,
            position: String,
            duration: String,
            description: String,
            startDate: Date,
            endDate: Date,
            currentlyWorking: {
              type: Boolean,
              default: false
            },
            skills: [String]
          }
        ]
      },

      documents: {
        resumeUrl: {
          type: String,
          default: null
        },
        coverLetter: {
          type: String,
          default: null
        },
        certificates: [
          {
            name: String,
            url: String,
            issuer: String,
            issueDate: Date,
            credentialId: String
          }
        ]
      }
    },

    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    lastProfileUpdate: {
      type: Date,
      default: null
    },
    lastLogin: {
      type: Date,
      default: null
    }
    ,
    resetPasswordToken: {
      type: String,
      default: null
    },
    resetPasswordExpires: {
      type: Date,
      default: null
    }
    ,
    emailBounced: {
      type: Boolean,
      default: false
    },
    lastEmailBounce: {
      type: Date,
      default: null
    },
    bounceReason: {
      type: String,
      default: null
    }
  },
  { 
    timestamps: false,
    collection: "users"
  }
);

userSchema.index({ role: 1 });
userSchema.index({ approvalStatus: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ placed: 1 });
userSchema.index({ "profile.basicInfo.institution": 1 });

userSchema.methods.getPublicProfile = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

userSchema.methods.getProfileCompletionPercentage = function () {
  let completed = 0;
  const total = 10;

  if (this.profile.basicInfo?.fullName) completed++;
  if (this.profile.basicInfo?.dateOfBirth) completed++;
  if (this.profile.basicInfo?.bio) completed++;
  if (this.profile.mobileNumber) completed++;
  if (this.profile.alternateEmail) completed++;
  if (this.profile.academicInfo?.institution) completed++;
  if (this.profile.academicInfo?.cgpa) completed++;
  if (this.profile.skills?.technical?.length > 0) completed++;
  if (this.profile.documents?.resumeUrl) completed++;
  if (this.profile.experience?.internships?.length > 0) completed++;

  return Math.round((completed / total) * 100);
};

userSchema.methods.getProfileCompletionStatus = function () {
  return {
    contactInfo: {
      completed: !!this.profile.mobileNumber && !!this.profile.alternateEmail,
      fields: {
        mobileNumber: !!this.profile.mobileNumber,
        alternateEmail: !!this.profile.alternateEmail
      }
    },
    basicInfo: {
      completed:
        !!this.profile.basicInfo?.fullName &&
        !!this.profile.basicInfo?.dateOfBirth &&
        !!this.profile.basicInfo?.bio,
      fields: {
        fullName: !!this.profile.basicInfo?.fullName,
        dateOfBirth: !!this.profile.basicInfo?.dateOfBirth,
        bio: !!this.profile.basicInfo?.bio,
        profilePicture: !!this.profile.basicInfo?.profilePicture
      }
    },
    academicInfo: {
      completed:
        !!this.profile.academicInfo?.institution &&
        !!this.profile.academicInfo?.cgpa,
      fields: {
        currentDegree: !!this.profile.academicInfo?.currentDegree,
        institution: !!this.profile.academicInfo?.institution,
        cgpa: !!this.profile.academicInfo?.cgpa
      }
    },
    skills: {
      completed: this.profile.skills?.technical?.length > 0,
      count: this.profile.skills?.technical?.length || 0
    },
    documents: {
      completed: !!this.profile.documents?.resumeUrl,
      fields: {
        resume: !!this.profile.documents?.resumeUrl,
        experience: this.profile.experience?.internships?.length > 0
      }
    }
  };
};

module.exports = mongoose.model("User", userSchema);
