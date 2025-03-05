const mongoose = require("mongoose");  
const UserSchema = new mongoose.Schema({
    googleId: { type: String, unique: true, required: true },
    name: String,
    email: { type: String, unique: true },
    googleAccessToken: String,  // Store Google OAuth Access Token
    googleRefreshToken: String,  // Store Google OAuth Refresh Token
});

const User = mongoose.model("User", UserSchema);
module.exports = User;