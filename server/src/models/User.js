const mongoose = require("mongoose");

// just identity + auth fields, role-specific data goes in its own model later
// password hashing happens in utils/password.js, not here
const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true, // no two users with the same email
      lowercase: true, // so emails aren't case sensitive
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never returned by a query unless explicitly asked for
    },
    role: {
      type: String,
      enum: ["candidate", "recruiter", "company_admin", "platform_admin"],
      default: "candidate",
      index: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false, // flipped in the email-verification slice
    },
    emailVerificationTokenHash: { type: String, select: false, default: null },
    emailVerificationExpires: { type: Date, select: false, default: null },
    passwordResetTokenHash: { type: String, select: false, default: null },
    passwordResetExpires: { type: Date, select: false, default: null },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null, // filled during recruiter/company onboarding
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },
    lastLoginAt: { type: Date, default: null },

    /**
     * When the password was last changed. Any access or refresh token issued
     * BEFORE this moment is rejected, which is how a password reset actually
     * ends sessions an attacker may already hold. select:false because nothing
     * outside auth needs it.
     */
    passwordChangedAt: { type: Date, default: null, select: false },
  },
  { timestamps: true } // gives createdAt + updatedAt for free
);

// only these fields get sent back to the client, so passwordHash never leaks
userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    fullName: this.fullName,
    email: this.email,
    role: this.role,
    isEmailVerified: this.isEmailVerified,
    companyId: this.companyId,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("User", userSchema);