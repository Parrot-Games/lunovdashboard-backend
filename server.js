import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as DiscordStrategy } from "passport-discord";
import dotenv from "dotenv";
import fetch from "node-fetch";
import cors from "cors";

dotenv.config();
const app = express();

// Allow frontend (lunov dashboard) to access API
app.use(cors({
  origin: "*",
  credentials: true,
}));

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || "supersecretkey",
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

// Serialize user data
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Discord OAuth2 strategy
passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: process.env.DISCORD_REDIRECT_URI,
      scope: ["identify", "guilds"],
    },
    (accessToken, refreshToken, profile, done) => {
      profile.accessToken = accessToken;
      return done(null, profile);
    }
  )
);

// Routes
app.get("/", (req, res) => {
  res.send("✅ Lunov backend is online!");
});

app.get("/api/auth/discord", passport.authenticate("discord"));

app.get(
  "/api/auth/discord/callback",
  passport.authenticate("discord", { failureRedirect: "/" }),
  (req, res) => {
    // Redirect user to lunov frontend dashboard after login
    res.redirect(`https://lunov.rf.gd/index.html?user=${req.user.id}`);
  }
);

app.get("/api/me", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not logged in" });
  res.json(req.user);
});

app.get("/api/guilds", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not logged in" });

  const userGuilds = req.user.guilds;
  const botGuilds = await fetch("https://discord.com/api/users/@me/guilds", {
    headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` },
  }).then(r => r.json());

  const mutual = userGuilds.filter(g => botGuilds.find(b => b.id === g.id));
  res.json(mutual);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Lunov backend running on port ${PORT}`));
