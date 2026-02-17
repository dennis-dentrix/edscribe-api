// controllers/usersController.js
const User = require("../models/User");

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password").lean();

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    return next(error); // use your global error middleware
  }
};

module.exports = {
  getAllUsers,
};
