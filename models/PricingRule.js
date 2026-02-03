/**
 * PricingRule Model
 * Stores configurable pricing multipliers for order calculations
 */

const mongoose = require("mongoose");

const pricingRuleSchema = new mongoose.Schema(
  {
    // Rule identification
    name: {
      type: String,
      required: [true, "Rule name is required"],
      unique: true,
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },

    // Rule category
    category: {
      type: String,
      required: true,
      enum: {
        values: [
          "education_level",
          "task_type",
          "urgency",
          "complexity",
          "page_count",
          "citation_style",
        ],
        message: "Invalid rule category",
      },
    },

    // Rule configuration
    multiplier: {
      type: Number,
      required: [true, "Multiplier is required"],
      min: [0.1, "Multiplier must be at least 0.1"],
      max: [10, "Multiplier cannot exceed 10"],
    },
    basePrice: {
      type: Number,
      default: 0,
      min: [0, "Base price cannot be negative"],
    },

    // Specific value this rule applies to
    appliesTo: {
      type: String,
      required: true,
      trim: true,
    },

    // Display information
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
      min: [0, "Display order cannot be negative"],
    },

    // Active status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Priority (higher priority rules are applied first)
    priority: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
pricingRuleSchema.index({ category: 1, isActive: 1 });
pricingRuleSchema.index({ appliesTo: 1 });
pricingRuleSchema.index({ priority: -1 });

// Static method to get active rules by category
pricingRuleSchema.statics.getActiveRulesByCategory = async function (category) {
  return await this.find({ category, isActive: true }).sort({
    priority: -1,
    displayOrder: 1,
  });
};

// Static method to calculate price
pricingRuleSchema.statics.calculatePrice = async function (orderData) {
  // Default base price per page
  let basePricePerPage = 15;

  // Get base price rule if exists
  const baseRule = await this.findOne({
    name: "base_price_per_page",
    isActive: true,
  });
  if (baseRule) {
    basePricePerPage = baseRule.basePrice || basePricePerPage;
  }

  // Calculate base price
  const pageCount = orderData.pageCount || 1;
  let totalPrice = basePricePerPage * pageCount;

  // Apply education level multiplier
  const educationRule = await this.findOne({
    category: "education_level",
    appliesTo: orderData.educationLevel,
    isActive: true,
  });
  if (educationRule) {
    totalPrice *= educationRule.multiplier;
  }

  // Apply task type multiplier
  const taskRule = await this.findOne({
    category: "task_type",
    appliesTo: orderData.taskType,
    isActive: true,
  });
  if (taskRule) {
    totalPrice *= taskRule.multiplier;
  }

  // Apply urgency multiplier
  const urgencyRule = await this.findOne({
    category: "urgency",
    appliesTo: orderData.urgency || "standard",
    isActive: true,
  });
  if (urgencyRule) {
    totalPrice *= urgencyRule.multiplier;
  }

  // Apply complexity multiplier
  const complexityRule = await this.findOne({
    category: "complexity",
    appliesTo: orderData.complexityLevel || "standard",
    isActive: true,
  });
  if (complexityRule) {
    totalPrice *= complexityRule.multiplier;
  }

  // Apply citation style multiplier if applicable
  if (orderData.citationStyle && orderData.citationStyle !== "none") {
    const citationRule = await this.findOne({
      category: "citation_style",
      appliesTo: orderData.citationStyle,
      isActive: true,
    });
    if (citationRule) {
      totalPrice *= citationRule.multiplier;
    }
  }

  // Round to 2 decimal places
  return Math.round(totalPrice * 100) / 100;
};

// Export pricing rule model
module.exports = mongoose.model("PricingRule", pricingRuleSchema);
