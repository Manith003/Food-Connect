// models/Community.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const communitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Community name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [200, 'Description cannot exceed 200 characters']
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],

    // Public / private flag
    isPrivate: {
      type: Boolean,
      default: false
    },

    // Hashed password for private communities
    passwordHash: {
      type: String // no "required" – controller enforces password validity
    },

    inviteCode: {
      type: String,
      unique: true,
      default: function () {
        return crypto.randomBytes(8).toString('hex');
      }
    },

    isActive: {
      type: Boolean,
      default: true
    },

    tags: [
      {
        type: String
      }
    ],

    maxMembers: {
      type: Number,
      default: 50
    }
  },
  {
    timestamps: true
  }
);

// 🔹 Helper to set password (hash it)
communitySchema.methods.setPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(password, salt);
};

// 🔹 Compare password method for private communities
communitySchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.isPrivate) return true; // Public communities don't need password
  if (!this.passwordHash) return false;
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// ✅ Add creator as first member when community is created
communitySchema.pre('save', function (next) {
  if (this.isNew && !this.members.includes(this.createdBy)) {
    this.members.push(this.createdBy);
  }
  next();
});

// 🔹 Clean JSON output: hide passwordHash, expose requiresPassword flag
communitySchema.methods.toJSON = function () {
  const community = this.toObject();
  delete community.passwordHash;
  if (this.isPrivate) {
    community.requiresPassword = true;
  }
  return community;
};

// 🔹 Optional helper: can this user join?
communitySchema.methods.canJoin = function (userId) {
  // Already a member
  if (this.members.includes(userId)) {
    return { canJoin: false, reason: 'Already a member' };
  }

  // Member limit
  if (this.members.length >= this.maxMembers) {
    return { canJoin: false, reason: 'Community is full' };
  }

  return { canJoin: true };
};

module.exports = mongoose.model('Community', communitySchema);
