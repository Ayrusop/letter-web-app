require("dotenv").config();
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const mongoose = require("mongoose");
const { google } = require("googleapis");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
// Load authentication strategy
require("./auth");
const Draft = require("./models/Draft");
const User = require("./models/User");

const app = express();
const upload = multer({ dest: "uploads/" });

// Google OAuth2 Client
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.BASE_URL
);

// Load tokens if available
if (process.env.GOOGLE_ACCESS_TOKEN && process.env.GOOGLE_REFRESH_TOKEN) {
    oauth2Client.setCredentials({
        access_token: process.env.GOOGLE_ACCESS_TOKEN,
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });
}

const drive = google.drive({ version: "v3", auth: oauth2Client });

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
    })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(cookieParser()); // Middleware to handle cookies

const authenticateJWT = async (req, res, next) => {
    const token = req.cookies.token; // Read token from cookie

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.userId); // Attach user data to request
        next();
    } catch (error) {
        res.status(403).json({ message: "Invalid or expired token" });
    }
};


// Authentication Routes
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get("/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    async (req, res) => {
        if (!req.user) return res.redirect("/");

        const { accessToken, refreshToken, id, displayname, email } = req.user;

        // Store Google OAuth tokens in the database
        const user = await User.findOneAndUpdate(
            { googleId: id },
            { name, email, googleAccessToken: accessToken, googleRefreshToken: refreshToken },
            { upsert: true, new: true }
        );

        // Generate JWT Token
        const token = jwt.sign({ userId: user._id, googleId: id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRY,
        });

        // Send JWT as an HTTP-only cookie (more secure than local storage)
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Secure only in production
            sameSite: "Strict",
        });

        res.redirect(`${process.env.FRONTEND_URL}/editor`);
    }
);

app.get("/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out successfully" });
});


app.get("/auth/user", authenticateJWT, (req, res) => {
    res.json({ id: req.user._id, name: req.user.name, email: req.user.email });
});


// Draft Routes
app.post("/api/drafts", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    try {
        const draft = new Draft({ userId: req.user.id, content: req.body.content });
        await draft.save();
        res.status(201).json({ message: "Draft saved successfully", draft });
    } catch (error) {
        res.status(500).json({ message: "Error saving draft", error });
    }
});

app.get("/api/drafts", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    try {
        const drafts = await Draft.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(drafts);
    } catch (error) {
        res.status(500).json({ message: "Error fetching drafts", error });
    }
});

// Upload to Google Drive
app.post("/api/upload", authenticateJWT, upload.single("file"), async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    try {
        // Fetch user from the database
        const user = await User.findOne({ googleId: req.user.id });
        if (!user || !user.googleAccessToken) {
            return res.status(401).json({ message: "Google authentication required" });
        }

        // Set Google OAuth credentials
        oauth2Client.setCredentials({
            access_token: user.googleAccessToken,
            refresh_token: user.googleRefreshToken,
        });

        // Upload file to Google Drive
        const fileMetadata = { name: req.file.originalname, parents: ["root"] };
        const media = { mimeType: "text/plain", body: fs.createReadStream(req.file.path) };

        const response = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: "id",
        });

        fs.unlinkSync(req.file.path);  // Cleanup

        res.status(200).json({ fileId: response.data.id });
    } catch (error) {
        console.error("Error uploading to Google Drive:", error);
        res.status(500).json({ error: "Upload failed" });
    }
});


// Connect to MongoDB and Start Server
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("MongoDB Connected");
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => console.error("MongoDB Connection Error:", err));
