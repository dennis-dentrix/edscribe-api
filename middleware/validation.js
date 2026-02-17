/**
 * Validation Middleware
 * Provides request validation using express-validator
 */

const { body, param, query, validationResult } = require("express-validator");

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),

  body("role")
    .optional()
    .isIn(["student", "tutor", "admin"])
    .withMessage("Role must be one of: student, tutor, admin"),

  handleValidationErrors,
];

const validateUserLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required"),

  handleValidationErrors,
];

const validatePasswordReset = [
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),

  handleValidationErrors,
];

const validateChangePassword = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "New password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),

  handleValidationErrors,
];

// Order validation rules
const validateOrderCreation = [
  body("educationLevel")
    .notEmpty()
    .withMessage("Education level is required")
    .isIn(["high_school", "undergraduate", "graduate", "phd"])
    .withMessage("Invalid education level"),

  body("taskType")
    .notEmpty()
    .withMessage("Task type is required")
    .isIn([
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
    ])
    .withMessage("Invalid task type"),

  body("subject")
    .trim()
    .notEmpty()
    .withMessage("Subject is required")
    .isLength({ max: 100 })
    .withMessage("Subject cannot exceed 100 characters"),

  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 200 })
    .withMessage("Title cannot exceed 200 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ max: 5000 })
    .withMessage("Description cannot exceed 5000 characters"),

  body("deadline")
    .notEmpty()
    .withMessage("Deadline is required")
    .isISO8601()
    .withMessage("Please provide a valid date")
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("Deadline must be in the future");
      }
      return true;
    }),

  body("pageCount")
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage("Page count must be between 1 and 200"),

  body("complexityLevel")
    .optional()
    .isIn(["basic", "standard", "advanced", "expert"])
    .withMessage("Invalid complexity level"),

  body("urgency")
    .optional()
    .isIn(["standard", "rush", "urgent"])
    .withMessage("Invalid urgency level"),

  body("citationStyle")
    .optional()
    .isIn(["apa", "mla", "chicago", "harvard", "ieee", "other", "none"])
    .withMessage("Invalid citation style"),

  body("additionalInstructions")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Additional instructions cannot exceed 2000 characters"),

  handleValidationErrors,
];

const validateOrderUpdate = [
  param("id").isMongoId().withMessage("Invalid order ID"),

  body("status")
    .optional()
    .isIn(["pending", "in_progress", "review", "completed", "cancelled"])
    .withMessage("Invalid status"),

  body("adminNotes")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Admin notes cannot exceed 2000 characters"),

  handleValidationErrors,
];

const validateOrderId = [
  param("id").isMongoId().withMessage("Invalid order ID"),

  handleValidationErrors,
];

// Pricing validation rules
const validatePricingRule = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Rule name is required")
    .isLength({ max: 100 })
    .withMessage("Name cannot exceed 100 characters"),

  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isIn([
      "education_level",
      "task_type",
      "urgency",
      "complexity",
      "page_count",
      "citation_style",
    ])
    .withMessage("Invalid category"),

  body("multiplier")
    .isFloat({ min: 0.1, max: 10 })
    .withMessage("Multiplier must be between 0.1 and 10"),

  body("appliesTo")
    .trim()
    .notEmpty()
    .withMessage("Applies to value is required"),

  body("displayName").trim().notEmpty().withMessage("Display name is required"),

  handleValidationErrors,
];

// Query validation for list endpoints
const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validatePasswordReset,
  validateChangePassword,
  validateOrderCreation,
  validateOrderUpdate,
  validateOrderId,
  validatePricingRule,
  validatePagination,
};
