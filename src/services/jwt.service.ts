import jwt, { JwtPayload } from 'jsonwebtoken';
import moment from 'moment';
import { JWT_ACCESS_EXPIRATION_MINUTES, JWT_PRIVATE_KEY, JWT_SECRET_KEY } from '@/config';
import { v4 } from 'uuid';

let jwtidCounter = 0;
const blacklist = [];
const JwtService = {
  jwtSign: (_payload: JwtPayload) => {
    try {
      console.log('[JWT] Generating fastify JWT sign');

      const payload = JSON.parse(JSON.stringify(_payload));

      jwtidCounter = jwtidCounter + 1;
      const id = v4();
      return jwt.sign(payload, JWT_PRIVATE_KEY, {
        expiresIn: Number(JWT_ACCESS_EXPIRATION_MINUTES) * 60000,
        jwtid: id,
        audience: '3',
        algorithm: 'RS256',
        notBefore: new Date().getDate() - 100,
      });
    } catch (error) {
      console.log('[JWT] Error during fastify JWT sign');
      throw error;
    }
  },

  jwtGetToken: request => {
    try {
      if (!request.headers.authorization || request.headers.authorization.split(' ')[0] !== 'Bearer') throw new Error('[JWT] JWT token not provided');

      return request.headers.authorization.split(' ')[1];
    } catch (error) {
      console.log('[JWT] Error getting JWT token');
      throw error;
    }
  },

  jwtVerify: (token: string): { id: number; role: string } => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET_KEY) as JwtPayload;
      blacklist.forEach(element => {
        if (element.jti === decoded.jti && element.iat === decoded.iat && element.exp === decoded.exp) throw new Error('Token is blacklisted');
      });
      return { id: decoded.id, role: decoded.role };
    } catch (error) {
      console.log('[JWT] Error getting JWT token');
      throw error;
    }
  },

  jwtBlacklistToken: (token: string) => {
    try {
      while (blacklist.length && moment().diff('1970-01-01 00:00:00Z', 'seconds') > blacklist[0].exp) {
        console.log(`[JWT] Removing from blacklist timed out JWT with id ${blacklist[0].jti}`);
        blacklist.shift();
      }
      jwt.verify(token, JWT_SECRET_KEY, (err, { jti, exp, iat }: JwtPayload) => {
        if (err != null) throw err;
        console.log(`[JWT] Adding JWT ${token} with id ${jti} to blacklist`);
        blacklist.push({ jti, exp, iat });
      });
    } catch (error) {
      console.log('[JWT] Error blacklisting fastify JWT token');
      throw error;
    }
  },
};

export default JwtService;
