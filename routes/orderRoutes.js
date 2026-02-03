/**
 * Order Routes
 * Defines API endpoints for order management
 */

const express = require("express");
const router = express.Router();

const {
  createOrder,
  getMyOrders,
  getOrder,
  getOrderByNumber,
  updateOrder,
  cancelOrder,
  reviewOrder,
  calculatePrice,
} = require("../controllers/orderController");

const { protect, authorize } = require("../middleware/auth");
const {
  validateOrderCreation,
  validateOrderUpdate,
  validateOrderId,
  validatePagination,
} = require("../middleware/validation");

// Price calculation (public for preview)
router.post("/calculate-price", calculatePrice);

// Protected routes
router.use(protect);

// Order CRUD
router
  .route("/")
  .get(validatePagination, getMyOrders)
  .post(validateOrderCreation, createOrder);

router
  .route("/:id")
  .get(validateOrderId, getOrder)
  .put(validateOrderUpdate, updateOrder);

// Additional endpoints
router.put("/:id/cancel", validateOrderId, cancelOrder);
router.post("/:id/review", validateOrderId, reviewOrder);
router.get("/number/:orderNumber", getOrderByNumber);

// Admin-only routes (would need admin middleware)
router.put("/:id/status", validateOrderId, authorize("admin"), updateOrder);

module.exports = router;
