const express = require("express");
const { google } = require("googleapis");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const router = express.Router();

// OAuth2 Client Setup
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const drive = google.drive({ version: "v3", auth: oauth2Client });

// File upload using multer
const upload = multer({ dest: "uploads/" });

// Upload letter to Google Drive
router.post("/upload", upload.single("file"), async (req, res) => {
    try {
        const fileMetadata = {
            name: req.file.originalname,
            parents: ["root"], // Change to a specific folder ID if needed
        };

        const media = {
            mimeType: "text/plain",
            body: fs.createReadStream(req.file.path),
        };

        const response = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: "id",
        });

        // Cleanup uploaded file
        fs.unlinkSync(req.file.path);

        res.status(200).json({ fileId: response.data.id });
    } catch (error) {
        console.error("Error uploading to Google Drive:", error);
        res.status(500).json({ error: "Upload failed" });
    }
});

module.exports = router;
