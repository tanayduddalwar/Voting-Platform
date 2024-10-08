const express = require("express");
const router = express.Router();
const usermodel = require('../models/users');
const { jwtAuthMiddleware, generateToken } = require("../jwt");
const bcrypt=require("bcrypt");
// POST /signup
router.post('/signup', async (req, res) => {
    console.log("At route signup currently");
    try {
        const data=req.body;
        const adminUser = await usermodel.findOne({ role: 'admin' });
        if (data.role === 'admin' && adminUser) {
            return res.status(400).json({ error: 'Admin user already exists' });
        }
        const newuser = new usermodel(data);
        const response = await newuser.save();
        console.log("Data Saved");

        const payload = {
            id: response._id  // Using _id generated by MongoDB
        };
        console.log(JSON.stringify(payload));

        const token = generateToken(payload);
        console.log("Token is:", token);
        res.status(200).json({ response, token });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// POST /login
router.post("/login", async (req, res) => {
    console.log("Inside the login route");
    try {
        const {  votingcardnumber, password } = req.body;
        const user = await usermodel.findOne({  votingcardnumber });
        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }

        // Directly compare the hashed password provided with the one stored in the database
        if (user.password !== password) {
            return res.status(401).json({ error: "Invalid/Incorrect Password" });
        }

        const payload = { id: user._id };
        const token = generateToken(payload);
        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// POST /profile
router.get("/profile", jwtAuthMiddleware, async (req, res) => {
    console.log("Inside profile route");
    try {
        const userdata = req.user;
        const userid = userdata.id;
        const user = await usermodel.findById(userid);
        res.status(200).json({ user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// PUT /profile/password
// PUT /profile/password - Update user password
router.put("/profile/password", jwtAuthMiddleware, async (req, res) => {
    console.log("Inside change password route");
    try {
        const { currentpassword, newpassword } = req.body;

        // Retrieve the user from the database using the user ID from the JWT middleware
        const userId = req.user.id;
        const user = await usermodel.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Compare the current password with the stored hashed password
        const isMatch = await bcrypt.compare(currentpassword, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid current password" });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newpassword, salt);

        // Save the updated user document
        await user.save();

        console.log("Password changed successfully");
        res.status(200).json({ message: "Password changed successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
