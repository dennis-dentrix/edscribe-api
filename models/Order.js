/**
 * Order Model
 * Represents academic service orders placed by students
 */

const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    // Reference to the student who placed the order
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Order must belong to a student"],
    },

    // Order identification
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },

    // Academic details
    educationLevel: {
      type: String,
      required: [true, "Education level is required"],
      enum: {
        values: ["high_school", "undergraduate", "graduate", "phd"],
        message: "Invalid education level",
      },
    },
    taskType: {
      type: String,
      required: [true, "Task type is required"],
      enum: {
        values: [
          "quiz",
          "essay",
          "research_paper",
          "technical_writing",
          "editing",
          "proofreading",
          "research_assistance",
          "tutoring",
          "formatting",
          "study_support",
          "thesis",
          "dissertation",
          "case_study",
          "report",
          "presentation",
        ],
        message: "Invalid task type",
      },
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      maxlength: [100, "Subject cannot exceed 100 characters"],
    },

    // Order specifications
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    additionalInstructions: {
      type: String,
      trim: true,
      maxlength: [
        2000,
        "Additional instructions cannot exceed 2000 characters",
      ],
      default: "",
    },

    // Deadline information
    deadline: {
      type: Date,
      required: [true, "Deadline is required"],
    },
    urgency: {
      type: String,
      enum: ["standard", "rush", "urgent"],
      default: "standard",
    },

    // Complexity and formatting
    complexityLevel: {
      type: String,
      enum: ["basic", "standard", "advanced", "expert"],
      default: "standard",
    },
    citationStyle: {
      type: String,
      enum: ["apa", "mla", "chicago", "harvard", "ieee", "other", "none"],
      default: "none",
    },
    numberOfSources: {
      type: Number,
      min: [0, "Number of sources cannot be negative"],
      default: 0,
    },
    pageCount: {
      type: Number,
      min: [1, "Page count must be at least 1"],
      default: 1,
    },

    // Pricing
    basePrice: {
      type: Number,
      required: true,
      min: [0, "Base price cannot be negative"],
    },
    totalPrice: {
      type: Number,
      required: true,
      min: [0, "Total price cannot be negative"],
    },
    currency: {
      type: String,
      default: "USD",
      uppercase: true,
    },

    // Payment status
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded", "failed"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["stripe", "paypal", "bank_transfer", "none"],
      default: "none",
    },
    transactionId: {
      type: String,
      default: null,
    },

    // Order status
    status: {
      type: String,
      enum: ["pending", "in_progress", "review", "completed", "cancelled"],
      default: "pending",
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["pending", "in_progress", "review", "completed", "cancelled"],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        note: String,
      },
    ],

    // Progress tracking
    progress: {
      type: Number,
      min: [0, "Progress cannot be negative"],
      max: [100, "Progress cannot exceed 100"],
      default: 0,
    },

    // Files
    attachments: [
      {
        filename: String,
        originalName: String,
        path: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Completed work files
    completedFiles: [
      {
        filename: String,
        originalName: String,
        path: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Admin notes (internal)
    adminNotes: {
      type: String,
      trim: true,
      default: "",
    },

    // Rating and review
    rating: {
      type: Number,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
      default: null,
    },
    review: {
      type: String,
      trim: true,
      maxlength: [1000, "Review cannot exceed 1000 characters"],
      default: "",
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for efficient queries
orderSchema.index({ student: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ deadline: 1 });

/**
 * Generate unique order number before saving
 */
orderSchema.pre("save", async function (next) {
  // Generate order number if it's a new document
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const randomNum = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0");
    this.orderNumber = `ORD-${year}${month}-${randomNum}`;

    // Add initial status to history
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      note: "Order created",
    });
  }

  next();
});

/**
 * Virtual for checking if deadline is passed
 */
orderSchema.virtual("isOverdue").get(function () {
  return (
    this.deadline < new Date() &&
    !["completed", "cancelled"].includes(this.status)
  );
});

/**
 * Virtual for days until deadline
 */
orderSchema.virtual("daysUntilDeadline").get(function () {
  const now = new Date();
  const deadline = new Date(this.deadline);
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

/**
 * Get formatted status for display
 */
orderSchema.methods.getFormattedStatus = function () {
  const statusMap = {
    pending: "Pending",
    in_progress: "In Progress",
    review: "Under Review",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return statusMap[this.status] || this.status;
};

/**
 * Get formatted education level for display
 */
orderSchema.methods.getFormattedEducationLevel = function () {
  const levelMap = {
    high_school: "High School",
    undergraduate: "Undergraduate",
    graduate: "Graduate",
    phd: "PhD",
  };
  return levelMap[this.educationLevel] || this.educationLevel;
};

/**
 * Get formatted task type for display
 */
orderSchema.methods.getFormattedTaskType = function () {
  const typeMap = {
    essay: "Essay",
    research_paper: "Research Paper",
    technical_writing: "Technical Writing",
    editing: "Editing",
    proofreading: "Proofreading",
    research_assistance: "Research Assistance",
    tutoring: "Tutoring",
    formatting: "Formatting",
    study_support: "Study Support",
    thesis: "Thesis",
    dissertation: "Dissertation",
    case_study: "Case Study",
    report: "Report",
    presentation: "Presentation",
  };
  return typeMap[this.taskType] || this.taskType;
};

// Export order model
module.exports = mongoose.model("Order", orderSchema);
