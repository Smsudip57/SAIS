const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const router = express.Router();
// const nodemailer = require("nodemailer");
// const crypto = require("crypto");
const JWT_SECRET = process.env.JWT_SECRET;

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    // console.log(req.body)
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }
    if (user.isBanned)
      return res.status(401).json({
        success: false,
        message: "You are banned from using this service.",
      });
    // console.log(user)

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid email or password.",
      });
    }
    user.lastLogin = Date.now();
    await user.save();

    user.password = undefined;

    const refreshtoken = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "30d",
    });
    res.cookie("refresh", refreshtoken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
    });
    const accesstoken = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.cookie("access", accesstoken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
    });
    return res.status(200).json({
      success: true,
      message: "Login successful.",
      user: user,
    });
  } catch (error) {
    console.error("Error during login:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while logging in." });
  }
});

// Helper function for cosine similarity
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Face authentication login
router.post("/login/face", async (req, res) => {
  try {
    const { email, faceDescriptor } = req.body;

    if (!email || !faceDescriptor || !Array.isArray(faceDescriptor)) {
      return res.status(400).json({
        success: false,
        message: "Email and valid face descriptor are required.",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    if (user.isBanned) {
      return res.status(401).json({
        success: false,
        message: "You are banned from using this service.",
      });
    }

    // Check if face auth is enabled
    if (!user.faceBiometric || !user.faceBiometric.isEnabled) {
      return res.status(400).json({
        success: false,
        message: "Face authentication not enabled for this user.",
      });
    }

    // Verify face descriptor
    const similarity = cosineSimilarity(
      faceDescriptor,
      user.faceBiometric.faceDescriptor
    );

    const SIMILARITY_THRESHOLD = 0.6;
    const isMatch = similarity >= SIMILARITY_THRESHOLD;

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Face verification failed.",
        similarity,
      });
    }

    // Update last used and last login
    user.faceBiometric.lastUsedAt = new Date();
    user.lastLogin = Date.now();
    await user.save();

    user.password = undefined;

    // Generate tokens
    const refreshtoken = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "30d",
    });
    res.cookie("refresh", refreshtoken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
    });

    const accesstoken = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.cookie("access", accesstoken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Face authentication successful.",
      user: user,
      similarity,
    });
  } catch (error) {
    console.error("Error during face login:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during face authentication.",
      error: error.message,
    });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      isActive: true,
      profile: {
        name: `${firstName} ${lastName}`,
      },
    });

    const refreshtoken = jwt.sign({ userId: newUser._id }, JWT_SECRET, {
      expiresIn: "30d",
    });
    res.cookie("refresh", refreshtoken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
    });
    const accesstoken = jwt.sign({ userId: newUser._id }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.cookie("access", accesstoken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
    });
    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      user: {
        _id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        profile: newUser.profile,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Error during registration:", error);
    const mongooseerror = error.message
      ? error.message.split(":").pop().trim()
      : null;
    return res.status(500).json({
      success: false,
      message: mongooseerror || "An error occurred during registration.",
    });
  }
});

router.post("/google-getway", async (req, res) => {
  try {
    const { name, email, photoURL, googleId, userRefCode } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({
        success: false,
        message: "Something went wrong. Please try again.",
      });
    }

    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const firstName = name ? name.split(" ")[0] : email.split("@")[0];
      const lastName =
        name && name.split(" ").length > 1
          ? name.split(" ").slice(1).join(" ")
          : "";

      user = new User({
        email,
        googleId,
        firstName,
        lastName,
        isActive: true,
        profile: {
          name: name || email.split("@")[0],
          avatarUrl: photoURL,
        },
        address: {
          street: "",
          city: "",
          state: "",
          country: "",
          pincode: "",
        },
        role: "user",
        balance: 0,
        lastLogin: Date.now(),
      });

      await user.save();
    } else {
      if (user.isBanned)
        return res.status(401).json({
          success: false,
          message: "You are banned from using this service.",
        });
      if (!user.googleId) {
        user.googleId = googleId;
      }

      if (
        photoURL &&
        user.profile.avatarUrl === "https://default-avatar-url.com"
      ) {
        user.profile.avatarUrl = photoURL;
      }

      user.lastLogin = Date.now();
      await user.save();
    }

    user = user.toObject();
    delete user.varificationcode;
    const refreshtoken = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "30d",
    });

    res.cookie("refresh", refreshtoken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
    });

    const accesstoken = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("access", accesstoken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
    });

    return res.status(isNewUser ? 201 : 200).json({
      success: true,
      message: isNewUser ? "Registration successful." : "Login successful.",
      user: user,
    });
  } catch (error) {
    console.error("Error during Google authentication:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)
          .map((err) => err.message)
          .join(", "),
      });
    }

    return res.status(500).json({
      success: false,
      message: "An error occurred during Google authentication.",
    });
  }
});

router.get("/getuserinfo", async (req, res) => {
  try {
    const accessToken = req.cookies.access;
    const refreshToken = req.cookies.refresh;
    if (!accessToken && !refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    let access;
    try {
      access = jwt.verify(accessToken, process.env.JWT_SECRET);
    } catch (error) { }

    let refresh;
    try {
      refresh = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch (error) {
      res.clearCookie("refresh", { path: "/" });
      res.clearCookie("access", { path: "/" });
      return res.status(403).json({
        success: false,
        message: "Your session has expired",
      });
    }
    if (!refresh) {
      res.clearCookie("refresh", { path: "/" });
      res.clearCookie("access", { path: "/" });
      return res.status(403).json({
        success: false,
        message: "Your session has expired",
      });
    }

    const { userId } = refresh;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      res.clearCookie("refresh", { path: "/" });
      res.clearCookie("access", { path: "/" });
      return res.status(404).json({
        success: false,
        message: "Unauthorized",
      });
    }
    if (user.isBanned) {
      res.clearCookie("refresh", { path: "/" });
      res.clearCookie("access", { path: "/" });
      return res.status(401).json({
        success: false,
        message: "You are banned from using this service.",
      });
    }
    if (!access) {
      const refreshtoken = jwt.sign({ userId: user._id }, JWT_SECRET, {
        expiresIn: "30d",
      });
      res.cookie("refresh", refreshtoken, {
        httpOnly: true,
        secure: true,
        path: "/",
      });
      const accesstoken = jwt.sign({ userId: user._id }, JWT_SECRET, {
        expiresIn: "1h",
      });
      res.cookie("access", accesstoken, {
        httpOnly: true,
        sameSite: "None",
        path: "/",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User retrieved successfully.",
      user: user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({
      error: "An error occurred while fetching the user.",
    });
  }
});

router.get("/user/logout", (req, res) => {
  try {
    res.clearCookie("refresh", { path: "/" });
    res.clearCookie("access", { path: "/" });

    return res.status(200).json({
      success: true,
      message: "Logout successful.",
    });
  } catch (error) {
    console.error("Error during logout:", error);
    return res.status(500).json({ error: "An error occurred during logout." });
  }
});

module.exports = router;
