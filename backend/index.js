require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const router = express.Router();
require("./auth");
const app = express();
app.use(cors());
app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => {
        res.redirect("http://localhost:3000"); // Redirect to frontend
    }
);

app.get("/auth/logout", (req, res) => {
    req.logout(() => {
        res.redirect("http://localhost:3000");
    });
});

app.get("/auth/user", (req, res) => {
    res.json(req.user || null);
});
router.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
    "/auth/google/callback",
    passport.authenticate("google", {
        successRedirect: "http://localhost:3000/dashboard", // Redirect on success
        failureRedirect: "http://localhost:3000/login", // Redirect on failure
    })
);
// Middleware
app.use(
    cors({
        origin: "http://localhost:3000",
        methods: "GET, POST, PUT, DELETE",
        credentials: true,
    })
);


app.use(express.json());
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false, httpOnly: true, sameSite: "lax" },
    })
);
app.use(passport.initialize());
app.use(passport.session());

app.listen(5000, () => console.log("Backend running on port 5000"));
