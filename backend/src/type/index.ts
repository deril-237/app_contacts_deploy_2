import { Request, RequestHandler } from "express";
import { extend } from "joi";
import * as jwt from "jsonwebtoken";

export enum TypeToken {
  accessToken,
  refresToken,
  tempToken

}

export interface UserPlayload {
  id: number;
  role: {
    id: number;
    name: string
  }
}

export interface DecodeAccessToken extends jwt.JwtPayload {
  id: number;
  role: {
    id: number;
    name: string;
  }
  type: TypeToken.accessToken
}


export interface DecodeTemporaryToken extends jwt.JwtPayload {
  email: string,
  id: string,
  type: TypeToken.tempToken
}

export interface RequestAuth extends Request {
  user: DecodeAccessToken;
}

export interface RequestFile extends Request {

}