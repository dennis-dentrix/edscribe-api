/**
 * Order Controller
 * Handles order creation, retrieval, and updates
 */

const Order = require("../models/Order");
const PricingRule = require("../models/PricingRule");

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const orderData = {
      ...req.body,
      student: req.user._id,
    };

    // Calculate price using pricing rules
    const totalPrice = await PricingRule.calculatePrice(orderData);
    orderData.basePrice = totalPrice / 1; // Simplified for MVP
    orderData.totalPrice = totalPrice;

    // Determine urgency based on deadline
    const deadline = new Date(orderData.deadline);
    const now = new Date();
    const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);

    if (hoursUntilDeadline <= 24) {
      orderData.urgency = "urgent";
    } else if (hoursUntilDeadline <= 72) {
      orderData.urgency = "rush";
    } else {
      orderData.urgency = "standard";
    }

    // Create order (retry on rare orderNumber collisions)
    let order;
    let attempts = 0;
    while (!order && attempts < 3) {
      try {
        order = await Order.create(orderData);
      } catch (err) {
        if (err && err.code === 11000 && err.keyPattern?.orderNumber) {
          attempts += 1;
          continue;
        }
        throw err;
      }
    }

    if (!order) {
      return res.status(500).json({
        success: false,
        error: "Server error creating order",
      });
    }

    // Populate student info for response
    await order.populate("student", "firstName lastName email");

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({
      success: false,
      error: "Server error creating order",
    });
  }
};

// @desc    Get all orders for current user
// @route   GET /api/orders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    const query = { student: req.user._id };

    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Get total count
    const total = await Order.countDocuments(query);

    // Get orders
    const orders = await Order.find(query)
      .populate("student", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get my orders error:", error);
    res.status(500).json({
      success: false,
      error: "Server error fetching orders",
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "student",
      "firstName lastName email",
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    // Check if user owns this order or is admin
    if (
      order.student._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to view this order",
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({
      success: false,
      error: "Server error fetching order",
    });
  }
};

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private (Student can only cancel, Admin can update status)
const updateOrder = async (req, res) => {
  try {
    let order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    // Check authorization
    const isOwner = order.student.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to update this order",
      });
    }

    // Students can only cancel or add additional instructions
    if (isOwner && !isAdmin) {
      if (req.body.status && req.body.status !== "cancelled") {
        return res.status(403).json({
          success: false,
          error: "Students can only cancel orders",
        });
      }

      if (req.body.status === "cancelled") {
        if (["completed", "cancelled"].includes(order.status)) {
          return res.status(400).json({
            success: false,
            error: "Cannot cancel this order",
          });
        }
        order.status = "cancelled";
        order.statusHistory.push({
          status: "cancelled",
          timestamp: new Date(),
          note: "Cancelled by student",
        });
      }

      if (req.body.additionalInstructions) {
        order.additionalInstructions = req.body.additionalInstructions;
      }

      await order.save();
    } else {
      // Admin updates
      const { status, adminNotes, progress } = req.body;

      if (status && status !== order.status) {
        order.status = status;
        order.statusHistory.push({
          status,
          timestamp: new Date(),
          note: req.body.statusNote || `Status updated by admin`,
        });
      }

      if (adminNotes !== undefined) {
        order.adminNotes = adminNotes;
      }

      if (progress !== undefined) {
        order.progress = Math.max(0, Math.min(100, progress));
      }

      await order.save();
    }

    // Populate and return
    await order.populate("student", "firstName lastName email");

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Update order error:", error);
    res.status(500).json({
      success: false,
      error: "Server error updating order",
    });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    // Check ownership
    if (order.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to cancel this order",
      });
    }

    // Check if can be cancelled
    if (["completed", "cancelled"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: "This order cannot be cancelled",
      });
    }

    order.status = "cancelled";
    order.statusHistory.push({
      status: "cancelled",
      timestamp: new Date(),
      note: req.body.reason || "Cancelled by student",
    });

    await order.save();
    await order.populate("student", "firstName lastName email");

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({
      success: false,
      error: "Server error cancelling order",
    });
  }
};

// @desc    Add review to order
// @route   POST /api/orders/:id/review
// @access  Private
const reviewOrder = async (req, res) => {
  try {
    const { rating, review } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    // Check ownership
    if (order.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to review this order",
      });
    }

    // Check if order is completed
    if (order.status !== "completed") {
      return res.status(400).json({
        success: false,
        error: "Can only review completed orders",
      });
    }

    // Check if already reviewed
    if (order.rating !== null) {
      return res.status(400).json({
        success: false,
        error: "Order has already been reviewed",
      });
    }

    order.rating = rating;
    order.review = review;
    order.reviewedAt = new Date();

    await order.save();

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Review order error:", error);
    res.status(500).json({
      success: false,
      error: "Server error submitting review",
    });
  }
};

// @desc    Get order by order number
// @route   GET /api/orders/number/:orderNumber
// @access  Private
const getOrderByNumber = async (req, res) => {
  try {
    const order = await Order.findOne({
      orderNumber: req.params.orderNumber,
    }).populate("student", "firstName lastName email");

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    // Check authorization
    if (
      order.student._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to view this order",
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Get order by number error:", error);
    res.status(500).json({
      success: false,
      error: "Server error fetching order",
    });
  }
};

// @desc    Calculate price for order preview
// @route   POST /api/orders/calculate-price
// @access  Private
const calculatePrice = async (req, res) => {
  try {
    const price = await PricingRule.calculatePrice(req.body);

    res.json({
      success: true,
      data: {
        totalPrice: price,
        currency: "USD",
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

module.exports = {
  createOrder,
  getMyOrders,
  getOrder,
  getOrderByNumber,
  updateOrder,
  cancelOrder,
  reviewOrder,
  calculatePrice,
};
