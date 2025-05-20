import { TypeToken } from "../type";
import * as jwt from "jsonwebtoken";
import { UserPlayload, DecodeAccessToken, DecodeTemporaryToken } from "../type";

interface DecodeRefreshToken extends jwt.JwtPayload {
  email: string,
  type: TypeToken.refresToken
}


export function getPrivateKeyToken(type: TypeToken) {
  const result = type === TypeToken.accessToken ?
    process.env.PRIVATE_KEY_JWT_ACCESS_TOKEN
    : process.env.PRIVATE_KEY_JWT_REFRESH_TOKEN_TOKEN;

  return result as string;
}

export function generateAccessToken(user: UserPlayload) {
  const token = jwt.sign({
    id: user.id,
    role: {
      id: user.role?.id,
      name: user.role?.name
    },
    type: TypeToken.accessToken,
  }, getPrivateKeyToken(TypeToken.accessToken),
    { expiresIn: '24h' });
  return token;
}

export function generateTempToken(email: string) {

  const token = jwt.sign({
    email,
    type: TypeToken.tempToken
  }, getPrivateKeyToken(TypeToken.tempToken), { expiresIn: '5min' });

  return token;
}

export function generateRefreshToken(email: string) {
  const refreshToken = jwt.sign({
    email,
    type: TypeToken.refresToken
  }, getPrivateKeyToken(TypeToken.refresToken), {
    expiresIn: '30day'
  });

  return refreshToken;
}

export function verifyAcessToken(token: string) {

  const decode = jwt.verify(token, getPrivateKeyToken(TypeToken.accessToken)) as DecodeAccessToken;
  if (decode.type === undefined || decode.type !== TypeToken.accessToken) {
    throw Error('Invalid token');
  }

  return decode;
}

export function verifyRefreshToken(token: string): DecodeRefreshToken {
  const decode = jwt.verify(token, getPrivateKeyToken(TypeToken.refresToken)) as DecodeRefreshToken;

  if (!decode.type || decode.type !== TypeToken.refresToken) {
    throw Error('Invalid token');
  }
  return decode;
}

export function verifyTempToken(token: string) {
  let decode: DecodeTemporaryToken;
  decode = jwt.verify(token, getPrivateKeyToken(TypeToken.refresToken)) as DecodeTemporaryToken;

  if (!decode.type || decode.type !== TypeToken.tempToken) {
    throw Error('Invalid token');
  }
  return decode;
}