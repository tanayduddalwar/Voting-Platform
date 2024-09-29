const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userschema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        validate: {
            validator: function (value) {
                return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value);
            },
            message: 'Please enter a valid email address.',
        },
    },
    address: {
        type: String,
    },
    age: {
        type: Number,
    },
    isVoted: {
        type: Boolean,
        default: false,
    },
    votingcardnumber: {
        type: String,
        required: true,
        unique: true,
    },
    usertype: {
        type: String,
        enum: ["voter", "admin"],
        default: "voter",
    },
    password: {
        type: String,
        required: true,
    },
});

// Pre-save middleware to hash the password before saving
userschema.pre("save", async function (next) {
    const user = this;

    // Hash the password only if it has been modified
    if (!user.isModified("password")) return next();

    try {
        // Generate salt and hash the password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        next();
    } catch (err) {
        return next(err);
    }
});

// Method to compare passwords
userschema.methods.comparePassword = async function (candidate_password) {
    try {
        return await bcrypt.compare(candidate_password, this.password);
    } catch (err) {
        console.error('Error comparing password:', err);
        return false; // Explicitly return false if an error occurs
    }
};

// Create and export the User model
const usermodel = mongoose.model("User", userschema);
module.exports = usermodel;
