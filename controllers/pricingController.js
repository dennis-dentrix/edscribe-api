/**
 * Pricing Controller
 * Handles pricing rules management
 */

const PricingRule = require("../models/PricingRule");

// @desc    Get all pricing rules
// @route   GET /api/pricing
// @access  Private/Admin
const getPricingRules = async (req, res) => {
  try {
    const rules = await PricingRule.find({ isActive: true }).sort({
      category: 1,
      displayOrder: 1,
    });

    // Group by category for frontend
    const groupedRules = rules.reduce((acc, rule) => {
      if (!acc[rule.category]) {
        acc[rule.category] = [];
      }
      acc[rule.category].push({
        value: rule.appliesTo,
        label: rule.displayName,
        multiplier: rule.multiplier,
      });
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        rules,
        groupedRules,
      },
    });
  } catch (error) {
    console.error("Get pricing rules error:", error);
    res.status(500).json({
      success: false,
      error: "Server error fetching pricing rules",
    });
  }
};

// @desc    Get single pricing rule
// @route   GET /api/pricing/:id
// @access  Private/Admin
const getPricingRule = async (req, res) => {
  try {
    const rule = await PricingRule.findById(req.params.id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: "Pricing rule not found",
      });
    }

    res.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    console.error("Get pricing rule error:", error);
    res.status(500).json({
      success: false,
      error: "Server error fetching pricing rule",
    });
  }
};

// @desc    Create pricing rule
// @route   POST /api/pricing
// @access  Private/Admin
const createPricingRule = async (req, res) => {
  try {
    const rule = await PricingRule.create(req.body);

    res.status(201).json({
      success: true,
      data: rule,
    });
  } catch (error) {
    console.error("Create pricing rule error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Pricing rule with this name already exists",
      });
    }

    res.status(500).json({
      success: false,
      error: "Server error creating pricing rule",
    });
  }
};

// @desc    Update pricing rule
// @route   PUT /api/pricing/:id
// @access  Private/Admin
const updatePricingRule = async (req, res) => {
  try {
    const rule = await PricingRule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: "Pricing rule not found",
      });
    }

    res.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    console.error("Update pricing rule error:", error);
    res.status(500).json({
      success: false,
      error: "Server error updating pricing rule",
    });
  }
};

// @desc    Delete pricing rule
// @route   DELETE /api/pricing/:id
// @access  Private/Admin
const deletePricingRule = async (req, res) => {
  try {
    const rule = await PricingRule.findByIdAndDelete(req.params.id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: "Pricing rule not found",
      });
    }

    res.json({
      success: true,
      message: "Pricing rule deleted",
    });
  } catch (error) {
    console.error("Delete pricing rule error:", error);
    res.status(500).json({
      success: false,
      error: "Server error deleting pricing rule",
    });
  }
};

// @desc    Calculate price preview
// @route   POST /api/pricing/calculate
// @access  Public
const calculatePrice = async (req, res) => {
  try {
    const price = await PricingRule.calculatePrice(req.body);

    res.json({
      success: true,
      data: {
        totalPrice: price,
        currency: "USD",
        breakdown: req.body, // Echo back for transparency
      },
    });
  } catch (error) {
    console.error("Calculate price error:", error);
    res.status(500).json({
      success: false,
      error: "Server error calculating price",
    });
  }
};

// @desc    Seed default pricing rules
// @route   POST /api/pricing/seed
// @access  Private/Admin
const seedPricingRules = async (req, res) => {
  try {
    // Default pricing rules
    const defaultRules = [
      // Education Level Multipliers
      {
        name: "high_school_level",
        category: "education_level",
        multiplier: 1.0,
        appliesTo: "high_school",
        displayName: "High School",
        displayOrder: 1,
        priority: 10,
      },
      {
        name: "undergraduate_level",
        category: "education_level",
        multiplier: 1.5,
        appliesTo: "undergraduate",
        displayName: "Undergraduate",
        displayOrder: 2,
        priority: 10,
      },
      {
        name: "graduate_level",
        category: "education_level",
        multiplier: 2.0,
        appliesTo: "graduate",
        displayName: "Graduate",
        displayOrder: 3,
        priority: 10,
      },
      {
        name: "phd_level",
        category: "education_level",
        multiplier: 3.0,
        appliesTo: "phd",
        displayName: "PhD",
        displayOrder: 4,
        priority: 10,
      },
      // Task Type Multipliers
      {
        name: "essay_task",
        category: "task_type",
        multiplier: 1.0,
        appliesTo: "essay",
        displayName: "Essay",
        displayOrder: 1,
        priority: 10,
      },
      {
        name: "research_paper_task",
        category: "task_type",
        multiplier: 1.5,
        appliesTo: "research_paper",
        displayName: "Research Paper",
        displayOrder: 2,
        priority: 10,
      },
      {
        name: "thesis_task",
        category: "task_type",
        multiplier: 3.0,
        appliesTo: "thesis",
        displayName: "Thesis",
        displayOrder: 3,
        priority: 10,
      },
      {
        name: "dissertation_task",
        category: "task_type",
        multiplier: 4.0,
        appliesTo: "dissertation",
        displayName: "Dissertation",
        displayOrder: 4,
        priority: 10,
      },
      {
        name: "editing_task",
        category: "task_type",
        multiplier: 0.6,
        appliesTo: "editing",
        displayName: "Editing",
        displayOrder: 5,
        priority: 10,
      },
      {
        name: "proofreading_task",
        category: "task_type",
        multiplier: 0.4,
        appliesTo: "proofreading",
        displayName: "Proofreading",
        displayOrder: 6,
        priority: 10,
      },
      // Urgency Multipliers
      {
        name: "standard_urgency",
        category: "urgency",
        multiplier: 1.0,
        appliesTo: "standard",
        displayName: "Standard (7+ days)",
        displayOrder: 1,
        priority: 5,
      },
      {
        name: "rush_urgency",
        category: "urgency",
        multiplier: 1.25,
        appliesTo: "rush",
        displayName: "Rush (3-7 days)",
        displayOrder: 2,
        priority: 5,
      },
      {
        name: "urgent_urgency",
        category: "urgency",
        multiplier: 1.5,
        appliesTo: "urgent",
        displayName: "Urgent (1-3 days)",
        displayOrder: 3,
        priority: 5,
      },
      // Complexity Multipliers
      {
        name: "basic_complexity",
        category: "complexity",
        multiplier: 0.8,
        appliesTo: "basic",
        displayName: "Basic",
        displayOrder: 1,
        priority: 5,
      },
      {
        name: "standard_complexity",
        category: "complexity",
        multiplier: 1.0,
        appliesTo: "standard",
        displayName: "Standard",
        displayOrder: 2,
        priority: 5,
      },
      {
        name: "advanced_complexity",
        category: "complexity",
        multiplier: 1.3,
        appliesTo: "advanced",
        displayName: "Advanced",
        displayOrder: 3,
        priority: 5,
      },
      {
        name: "expert_complexity",
        category: "complexity",
        multiplier: 1.5,
        appliesTo: "expert",
        displayName: "Expert",
        displayOrder: 4,
        priority: 5,
      },
      // Citation Style Multipliers
      {
        name: "no_citation",
        category: "citation_style",
        multiplier: 1.0,
        appliesTo: "none",
        displayName: "No Citation Style",
        displayOrder: 1,
        priority: 3,
      },
      {
        name: "apa_citation",
        category: "citation_style",
        multiplier: 1.1,
        appliesTo: "apa",
        displayName: "APA",
        displayOrder: 2,
        priority: 3,
      },
      {
        name: "mla_citation",
        category: "citation_style",
        multiplier: 1.1,
        appliesTo: "mla",
        displayName: "MLA",
        displayOrder: 3,
        priority: 3,
      },
      {
        name: "chicago_citation",
        category: "citation_style",
        multiplier: 1.15,
        appliesTo: "chicago",
        displayName: "Chicago",
        displayOrder: 4,
        priority: 3,
      },
      {
        name: "harvard_citation",
        category: "citation_style",
        multiplier: 1.15,
        appliesTo: "harvard",
        displayName: "Harvard",
        displayOrder: 5,
        priority: 3,
      },
      {
        name: "ieee_citation",
        category: "citation_style",
        multiplier: 1.2,
        appliesTo: "ieee",
        displayName: "IEEE",
        displayOrder: 6,
        priority: 3,
      },
    ];

    // Delete existing rules
    await PricingRule.deleteMany({});

    // Insert new rules
    const inserted = await PricingRule.insertMany(defaultRules);

    res.json({
      success: true,
      message: `Seeded ${inserted.length} pricing rules`,
      data: inserted,
    });
  } catch (error) {
    console.error("Seed pricing rules error:", error);
    res.status(500).json({
      success: false,
      error: "Server error seeding pricing rules",
    });
  }
};

module.exports = {
  getPricingRules,
  getPricingRule,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
  calculatePrice,
  seedPricingRules,
};
