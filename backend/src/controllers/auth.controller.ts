import { Request, Response, Handler, NextFunction } from "express";
import * as joi from 'joi';
import * as optGenrator from 'otp-generator';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as sequelize from 'sequelize';
import { listRole, Role, User } from "../models";
import { RequestAuth, TypeToken, UserPlayload } from "../type";
import { generateAccessToken, generateTempToken, verifyTempToken } from "../utils/token";
import { sendMail } from "../utils/email";



const TIME_EXPIRED_OTP_CODE = 5 // min

type FormCreateAccount = {
  name: string,
  email: string,
  password: string,
  confirmPassword: string,
  otpCode: string
};

type FormLogin = {
  email: string,
  password: string,
}

const AuthController = {
  async login(req: Request, res: Response, next: NextFunction) {

    // valide data
    const { error, value: { email, password } } = joi.object<FormLogin>({
      email: joi.string().email().required().trim()
        .messages({
          'any.required': 'The email is required',
          'string.email': 'Please give a good email',
        }),
      password: joi.string().required()
        .messages({
          'any.required': 'Password is required\n',
        })
    }).validate({
      email: req.body?.email,
      password: req.body?.password
    }, {
      abortEarly: false,
    });

    if (error) {
      res.status(400).json({ message: error.details.map(err => err.message).join("\n ") });
      console.log(error);
      return;
    }

    try {
      const user = await User.scope(['userVerify']).findOne({ where: { email } });
      // user exist
      if (user === null) {
        res.status(400).json({ message: "this email don't have account" });
        return;
      }

      // verify password
      const isValidPwd = await bcrypt.compare(password, user.password);
      if (!isValidPwd) {
        res.status(401).json({ message: 'password incorrect' });
        return;
      }

      res.json({
        token: generateAccessToken(user as UserPlayload),
        // refreshToken: generateRefreshToken(user.email) 
      });
      return;

    } catch (error) {
      // next({ error, message: 'Error when login to account try again' });
      res.status(500).json({ error: error, message: 'Error when login to account try again' });
      console.log(error);
      return;
    }
  },

  async createAccount(req: Request, res: Response, next: Handler) {
    const { error, value: { confirmPassword, ...data } } = joi.object<FormCreateAccount>({
      name: joi.string().pattern(/^[a-zA-Z][\w| +]+$/).trim().required().min(3).replace(/ +/, ' ')
        .messages({
          'pattern.base': 'Your user is incorrect please give a correct user name',
          'any.required': 'the user name is required',
          'string.min': 'the user name must be to have  least 3 caractere',
        }),
      email: joi.string().email().required().trim()
        .messages({
          'string.email': 'your email is incorrect . Please give a good email',
          'any.base': 'Your email is required',
        }),
      password: joi.string().min(7).required()
        .messages({
          'any.required': 'The password is required',
          'string.min': 'The password must be least 7 caractere',
        }),
      confirmPassword: joi.string().required().valid(joi.ref('password'))
        .messages({
          'any.only': 'the confirm password is incorrect',
          'any.required': 'the confirm password is required',
        }),
    }).validate({
      name: req.body.name,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
      email: req.body.email,
    });

    if (error) {
      res.status(400).json({ error: error, message: error.details.map(err => err.message).join('\n') });
      return;
    }

    //let transation: sequelize.Transaction | null = null
    try {
      // verify if email have a account
      // transation = await Database.getDb().transaction();
      let user: User | null = await User.findOne({ where: { email: data.email } });
      console.log(user);
      if (user && user.verify) {
        res.status(400).json({ message: 'A account created with this email. Please retry with ohter email' });
        return;
      }

      if (!user) {
        user = new User();
        user.email = data.email;
        user.roleId = listRole.USER?.id as number;
      }

      user.name = data.name;
      user.password = await bcrypt.hash(data.password, parseInt(process.env.SALT_HASH as string));

      user.otpCode = optGenrator.generate(4, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false
      });
      user.dateCreatedOtpCode = new Date().toISOString();
      const htmlBody = `
      <p> Your otp code is ${user.otpCode}
      </p>`;
      // const tempToken = generateTempToken(user.email);
      await sendMail(user.email, 'verification otp code', htmlBody);
      await user.save();
      res.json({ message: 'Your otp code sended on your email', TIME_EXPIRED_OTP_CODE });
      return;
    } catch (error) {
      res.status(500).json({ error: error, message: 'Error when create account try again' });
      console.log(error);
      return;
    }
  },

  async verifyOtpCode(req: Request, res: Response, next: Handler) {
    const { value: { otpCode, email }, error } = joi.object<{ otpCode: string, email: string }>({
      otpCode: joi.string().length(4).required().pattern(/[0-9]{4}/)
        .messages({
          'pattern.base': 'Your otpcode must be a number with 4 digits',
          'string.length': 'the user name must be to have  least 3 caractere',
          'any.required': 'code otp is required',
        }),
      email: joi.string().email().required().trim()
        .messages({
          'string.email': 'your email is incorrect . Please give a good email',
          'any.base': 'Your email is required',
        }),
      // tempToken: joi.string().required()
    }).validate({
      email: req.body.email,
      // tempToken: req.body.token,
      otpCode: req.body.otpCode,
    });

    try {
      // const decode = verifyTempToken(tempToken);
      const user = await User.findOne({ where: { email } });

      if (user && user.verify) {
        res.status(400).json({ message: 'A account created with this email. Please retry with ohter email' });
        return;
      }


      if (!user) {
        res.status(400).json({ message: 'This email don\'have a account' });
        return;
      }

      // verify if codeOtp don't expired
      if (user.otpCode !== otpCode) {
        res.status(400).json({ message: 'otp code is incorrect' });
        return;
      }

      const dateOtpCodeCreated = new Date(user.dateCreatedOtpCode);
      if (Date.now() - dateOtpCodeCreated.getTime() > TIME_EXPIRED_OTP_CODE * 60 * 1000) {   // expired 3 min
        res.status(403).json({ message: 'otp code expired' });
        return;
      }

      const token = generateAccessToken({
        id: user.id,
        role: {
          id: (user.role as Role).id,
          name: (user.role as Role).name
        }
      });
      user.verify = true;
      await user.save();
      res.json({ message: 'Your created with sucessul', token });
      return;
    } catch (error) {
      res.status(500).json({ error: error, message: 'Error when create account try again' });
      console.log(error);
      /*if (error instanceof jwt.JsonWebTokenError) {
        res.status(400).json({ message: 'Please give a valid token' });
      } else if (error instanceof jwt.TokenExpiredError) {
        res.status(400).json({ message: 'Your token expired' });
      } else {
        res.status(500).json({ error: error, message: 'Error when create account try again' });
        console.log(error);
      }*/
      return;
    }
  },

  async getNewPassword(req: Request, res: Response, next: NextFunction) {
    const { value: { email }, error } = joi.object({
      email: joi.string().required(),
    }).validate({
      email: req.body.email
    });

    if (error) {
      res.status(400).json({ error: error, message: error.details.map(err => err.message).join('\n') });
      return;
    }

    try {
      const user = await User.findOne({ where: { email } });

      if (!user || !user.verify) {
        res.status(400).json({ message: "The email don't have a account" });
        return;
      }

      const password = optGenrator.generate(parseInt(process.env.LENGTH_PASSWORD as string), {
        digits: true,
        lowerCaseAlphabets: true,
        upperCaseAlphabets: true,
        specialChars: true,
      });

      user.password = await bcrypt.hash(password, parseInt(process.env.SALT_HASH as string));
      const bodyEmail = `
        <p> Hello ${user.name} Your new password is ${password}. 
          Sing in with your new password after update your password
        <p>`;
      await sendMail(email, 'recovery password', bodyEmail);
      await user.save();

      res.json({ message: 'A new password we send to your email' });
      return;
    } catch (error) {
      console.log(error);
      res.status(500).json({ messaage: 'Error when generate new for you please retry' });
      return;
    }
  },

  /*
  async getProfile(req: RequestAuth, res: Response) {
    try {
      const user = await User.findByPk(req.user.id, { attributes: ['email', 'name', 'id'] });

      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: 'error when find your profile. Please try again' });
      return;
    }

  },

  async updateProfile(req: RequestAuth, res: Response) {
    const { value, error } = joi.object<{ name: string, email: string, password: string }>({
      name: joi.string().pattern(/^[a-zA-Z][\w| +]+$/),
      email: joi.string().email(),
      password: joi.string().min(8)
    })
      .validate({
        ...req.body,
      }, {
        allowUnknown: true,
      });
  }
  */
}

export default AuthController; 