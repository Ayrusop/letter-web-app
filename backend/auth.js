const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "http://localhost:5000/auth/google/callback",
            scope: ["profile", "email", "https://www.googleapis.com/auth/drive.file"],
            accessType: "offline",  // Required for refresh token
            prompt: "consent",      // Forces consent screen to get a refresh token
        },
        async (accessToken, refreshToken, profile, done) => {
            console.log("Access Token:", accessToken);
            console.log("Refresh Token:", refreshToken);  // Should not be undefined now

            profile.accessToken = accessToken;
            profile.refreshToken = refreshToken;

            done(null, profile);
        }
    )
);


passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});
