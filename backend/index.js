require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
require("./auth");
const app = express();

// Middleware for CORS before routing
app.use(cors({
    origin: "http://localhost:3000",
    methods: "GET, POST, PUT, DELETE",
    credentials: true,
}));

// Session and Passport setup
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, sameSite: "lax" },
}));
app.use(passport.initialize());
app.use(passport.session());

// Authentication routes
app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => {
        res.redirect("http://localhost:3000"); // Redirect to frontend
    }
);

app.get("/auth/logout", (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).send("Error logging out");
        }
        res.json(req.msg); // Redirect to frontend after logout
    });
});


app.get("/auth/user", (req, res) => {
    res.json(req.user || null);
});

// Start server
app.listen(5000, () => console.log("Backend running on port 5000"));
