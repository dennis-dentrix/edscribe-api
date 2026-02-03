/**
 * Pricing Routes
 * Defines API endpoints for pricing rules management
 */

const express = require("express");
const router = express.Router();

const {
  getPricingRules,
  getPricingRule,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
  calculatePrice,
  seedPricingRules,
} = require("../controllers/pricingController");

const { protect, authorize } = require("../middleware/auth");
const { validatePricingRule } = require("../middleware/validation");

// Public route for price calculation preview
router.post("/calculate", calculatePrice);

// Protected routes (Admin only)
router.use(protect);
router.use(authorize("admin"));

router
  .route("/")
  .get(getPricingRules)
  .post(validatePricingRule, createPricingRule);
router.post("/seed", seedPricingRules);
router
  .route("/:id")
  .get(getPricingRule)
  .put(updatePricingRule)
  .delete(deletePricingRule);

module.exports = router;
