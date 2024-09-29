const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');
const usermodel = require('../models/users');
const candidatemodel = require('../models/candidate');
const { jwtAuthMiddleware, generateToken } = require("../jwt");

// Helper function to check if user is an admin
const checkadmin = async (userId) => {
    try {
        console.log("Inside check function of admin");
        const user = await usermodel.findById(userId);
        return user && user.usertype === "admin";
    } catch (err) {
        return false;
    }
};

// POST / - Add new candidate (Admin only)
router.post('/', jwtAuthMiddleware, async (req, res) => {
    try {
        if (!(await checkadmin(req.user.id))) {
            return res.status(403).json({ message: 'User does not have admin role' });
        }

        const data = req.body; // Assuming the request body contains the candidate data
        const newCandidate = new candidatemodel(data);
        const response = await newCandidate.save();

        console.log('Data saved');
        res.status(200).json({ response });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT /:candidateId - Update candidate details (Admin only)
router.put("/:candidateId", jwtAuthMiddleware, async (req, res) => {
    console.log("Inside change candidate info");
    try {
        if (!(await checkadmin(req.user.id))) {
            return res.status(403).json({ message: "User doesn't have admin role" });
        }

        const candidateId = req.params.candidateId;

        // Validate if candidateId is valid
        if (!mongoose.Types.ObjectId.isValid(candidateId)) {
            return res.status(400).json({ error: "Invalid candidate ID" });
        }

        const updatedData = req.body;

        const response = await candidatemodel.findByIdAndUpdate(candidateId, updatedData, {
            new: true,
            runValidators: true
        });

        if (!response) {
            return res.status(404).json({ error: "Candidate not found" });
        }

        console.log("Candidate data updated");
        res.status(200).json({ message: "Candidate data updated", updatedCandidate: response });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// DELETE /:candidateId - Delete a candidate (Admin only)
router.delete("/:candidateId", jwtAuthMiddleware, async (req, res) => {
    console.log("Inside delete candidate info");
    try {
        if (!(await checkadmin(req.user.id))) {
            return res.status(403).json({ message: "User doesn't have admin role" });
        }

        const candidateId = req.params.candidateId;

        // Validate if candidateId is valid
        if (!mongoose.Types.ObjectId.isValid(candidateId)) {
            return res.status(400).json({ error: "Invalid candidate ID" });
        }

        const response = await candidatemodel.findByIdAndDelete(candidateId);
        if (!response) {
            return res.status(404).json({ error: "Candidate not found" });
        }

        console.log("Candidate data deleted");
        res.status(200).json({ message: "Candidate data deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// POST /vote/:candidateID - Vote for a candidate (User only)
router.post('/vote/:candidateID', jwtAuthMiddleware, async (req, res) => {
    console.log("Inside voting route");

    const candidateID = req.params.candidateID;
    const userId = req.user.id;

    try {
        // Validate if candidateID is valid
        if (!mongoose.Types.ObjectId.isValid(candidateID)) {
            return res.status(400).json({ error: "Invalid candidate ID" });
        }

        // Find the Candidate document with the specified candidateID
        const candidate = await candidatemodel.findById(candidateID);
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }

        const user = await usermodel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.usertype === 'admin') {
            return res.status(403).json({ message: 'Admin is not allowed to vote' });
        }
        if (user.isVoted) {
            return res.status(400).json({ message: 'You have already voted' });
        }

        // Update the Candidate document to record the vote
        candidate.votes.push({ user: userId });
        candidate.votecount++; // Ensure voteCount is correctly used across the routes
        await candidate.save();

        // Update the user document
        user.isVoted = true;
        await user.save();

        return res.status(200).json({ message: 'Vote recorded successfully' });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /vote/count - Get vote count for all candidates
router.get('/vote/count', async (req, res) => {
    try {
        // Find all candidates and sort them by voteCount in descending order
        const candidates = await candidatemodel.find().sort({ votecount: -1 });

        // Map the candidates to only return their name and voteCount
        const voteRecord = candidates.map((candidate) => {
            return {
                name: candidate.name,
                votecount: candidate.votecount // Consistent use of voteCount field
            };
        });

        return res.status(200).json(voteRecord);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET / - Get list of all candidates with only name and party fields
router.get('/', async (req, res) => {
    try {
        // Find all candidates and select only the name and party fields, excluding _id
        const candidates = await candidatemodel.find({}, 'name club -_id');

        res.status(200).json(candidates);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
