const { google } = require("googleapis");
require("dotenv").config();

// OAuth 2.0 Configuration
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Generate Auth URL
const getAuthURL = () => {
    const authURL = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: ["https://www.googleapis.com/auth/drive.file"],
    });
    return authURL;
};

module.exports = { oauth2Client, getAuthURL };
