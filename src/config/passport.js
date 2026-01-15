import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import User from '../models/User.js';

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Discord OAuth Strategy
passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: process.env.DISCORD_CALLBACK_URL,
    scope: ['identify', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists
      let user = await User.findOne({ discordId: profile.id });

      if (user) {
        // Update existing user
        user.discordUsername = profile.username;
        user.discordAvatar = profile.avatar;
        user.email = profile.email;
        user.lastLogin = new Date();
        await user.save();
      } else {
        // Create new user
        user = await User.create({
          discordId: profile.id,
          discordUsername: profile.username,
          discordAvatar: profile.avatar,
          email: profile.email,
          lastLogin: new Date()
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

export default passport;
