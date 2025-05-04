import passport from 'passport';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import { UserModel } from '@models/index';
import { JWT_SECRET_KEY } from '@config';
import { blacklist } from '@services/jwt.service';

export const setupPassport = () => {
  passport.serializeUser(function (user, done) {
    done(null, user);
  });
  passport.deserializeUser(function (user, done) {
    done(null, user);
  });
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKey: JWT_SECRET_KEY,
      },
      async (jwtPayload, done) => {
        try {
          const isBlacklisted = blacklist.some(item => item.jti === jwtPayload.jti);

          if (isBlacklisted) {
            return done(null, false, { message: 'Token is blacklisted' });
          }
          const user = await UserModel.findById(jwtPayload._id);
          if (!user) return done(null, false);
          return done(null, user);
        } catch (error) {
          return done(error, false);
        }
      },
    ),
  );
};
