import { Request, Response, NextFunction } from 'express';
import * as joi from 'joi';
import * as jwt from 'jsonwebtoken';
import { User } from '../models';
import { RequestAuth } from '../type';
import { verifyAcessToken } from '../utils/token';
import multers from 'multer';

interface DecodeAccessToken extends jwt.JwtPayload {
  id: number,
  role: {
    id: number,
    name: string
  }
}

const AuthMiddleware = {
  async authen(req: Request, res: Response, next: NextFunction) {

    // validate data
    const { error, value: { authorization } } = joi.object({
      authorization: joi.string().required()
        .messages({
          'any.required': 'Please give you acess token',
        })
    }).validate({
      authorization: req.headers.authorization
    });

    if (error) {
      res.status(400).json({ error: error, message: error.details.map(err => err.message).join('\n') });
      return;
    }

    try {
      const token = authorization.split(' ')[1];
      const decode = verifyAcessToken(token);
      (req as RequestAuth).user = decode;
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(400).json({ message: 'Your token expired' });
      }
      else if (error instanceof jwt.JsonWebTokenError) {
        res.status(400).json({ message: 'Please give a valid token' });
      } else {
        console.log(error);
        res.status(500).json({ error, message: 'Error when verify your token; Please retry' });
        // next();
      }
    }
  },

  /*
  requiredRole(role = Role.ADMIN) {
    return (req, res, next) => {
      if (role === Role.ADMIN && req.user.role.id !== Role.ADMIN) {
        res.status(403).json({ message: `User don't authorize to access ressource` });
        return;
      } else if (role === Role.SIMPLE_USER && req.user.role.id !== Role.SIMPLE_USER) {
        res.status(403).json({ message: `User don't authorize to access ressource` });
        return;
      }
      next();
    }
  }
    */
}

export default AuthMiddleware; 