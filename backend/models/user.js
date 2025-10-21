const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    trim: true,
    required: true,
  },
  lastName: {
    type: String,
    trim: true,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Please use a valid email address."],
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  profile: {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    avatarUrl: {
      type: String,
      default: "https://default-avatar-url.com",
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  tradingAccounts: {
    demo: {
      balance: {
        type: Number,
        default: 10000, // $10,000 default deposit for demo
        min: 0,
      },
      portfolioValue: {
        type: Number,
        default: 0,
        min: 0,
      },
      dayChange: {
        type: Number,
        default: 0,
      },
      dayChangePercent: {
        type: Number,
        default: 0,
      },
      totalInvested: {
        type: Number,
        default: 0,
        min: 0,
      },
      isActive: {
        type: Boolean,
        default: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
    real: {
      balance: {
        type: Number,
        default: 0, // User must deposit funds to real account
        min: 0,
      },
      portfolioValue: {
        type: Number,
        default: 0,
        min: 0,
      },
      dayChange: {
        type: Number,
        default: 0,
      },
      dayChangePercent: {
        type: Number,
        default: 0,
      },
      totalInvested: {
        type: Number,
        default: 0,
        min: 0,
      },
      isActive: {
        type: Boolean,
        default: false, // Disabled until user activates
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  },
  currentAccountType: {
    type: String,
    enum: ["demo", "real"],
    default: "demo", // Start with demo account
  },
  demoPositions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Position",
    },
  ],
  realPositions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Position",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});


userSchema.index({ createdAt: -1 });

// Update timestamp before saving
userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;
