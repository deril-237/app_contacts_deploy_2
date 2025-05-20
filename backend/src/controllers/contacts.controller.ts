import { Request, Response, NextFunction } from "express";
import * as joi from 'joi';
import path from "path";
import { Contact, User } from "../models";
import { RequestAuth } from "../type";
import { json } from "sequelize";
import multers, * as multer from 'multer';
import { deleteFile, uploadFile } from "../utils/upload";
import Database from "../database";
import parsePhoneNumber from 'libphonenumber-js';

const folderContact = '';

type ContactForm = {
  email: string,
  name: string,
  phoneNumber: string,
  ownerId: number
};

const ContactController = {
  async show(req: Request, res: Response, next: NewableFunction) {

  },

  async getAll(req: Request, res: Response, next: NextFunction) {
    console.log(req.get('host'));
    const { error, value: { page, limit } } = joi.object<{ page: number, limit: number }>({
      page: joi.number().default(0),
      limit: joi.number().default(50),
    }).validate({
      ...req.query
    }, {
      allowUnknown: true,
    });

    if (error) {
      res.status(400).json({ error: error, message: error.details.map(err => err.message).join('\n') });
      return;
    }

    try {
      const contacts = await Contact.findAndCountAll({
        attributes: ['id', 'name', 'email', 'phoneNumber', 'extPhoto', 'urlPhoto'],
        where: { ownerId: (req as RequestAuth).user.id },
        offset: page * limit,
        limit,
        order: [['name', 'ASC']]
      });

      res.json({ contacts });
    } catch (error) {
      res.status(500).json({ error: error, message: 'Error when get your contacts try again' });
      console.log(error);
      return;
    }
  },

  async add(req: Request, res: Response, next: NextFunction) {
    let { error, value: data } = joi.object<ContactForm>({
      email: joi.string().email().trim()
        .messages({
          'any.required': 'the email is required',
          'string.email': 'Please a good email ',
        }),
      name: joi.string().pattern(/^[a-zA-Z][\w| +]+$/).trim().min(3).replace(/ +/, ' ').required()
        .messages({
          'pattern.base': 'Your user is incorrect please give a correct user name',
          'string.min': 'the user name must be to have  least 3 caractere',
        }),
      phoneNumber: joi.string().required()
        //.pattern(/^\+{0,1}[0-9]{8,15}$/)
        .trim()
        .messages({
          'any.required': 'the phone number contact is required',
        }),
      ownerId: joi.number().integer().required().messages({
        'any.required': 'owner id is required',
      }),
    }).validate({
      ...req.body,
      ownerId: (req as RequestAuth).user.id,
    });

    if (error) {
      res.status(400).json({ error: error, message: error.details.map(err => err.message).join('\n') });
      return;
    }

    // const phoneNumber = parsePhoneNumber(data.phoneNumber);

    // if (!phoneNumber || !phoneNumber.isValid()) {
    //  res.status(400).json({ error: error, message: 'Invalid phone number' });
    //  return;
    //}

    const transaction = await Database.getDb().transaction();
    try {
      const contact = await Contact.create({
        ...data,
        extPhoto: req.file ? path.extname(req.file.path) : undefined
      });
      if (req.file) {
        await uploadFile(contact.pathPhoto, req.file as Express.Multer.File);
      }
      await transaction.commit();

      res.json({ contact: { ...contact.toJSON(), pathPhoto: undefined }, message: 'your contact added with successful' });
    } catch (error) {
      await transaction.rollback();
      res.status(500).json({ error: error, message: 'Error when create contacts try again' });
      console.log(error);
      return;
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    let { error, value: data } = joi.object<ContactForm>({
      email: joi.string().email().trim()
        .messages({
          'any.required': 'the email is required',
          'string.email': 'Please a good email ',
        }),
      name: joi.string().required().pattern(/^[a-zA-Z][\w| +]+$/).trim().min(3).replace(/ +/, ' ')
        .messages({
          'any.required': 'the name is required',
          'pattern.base': 'Your user is incorrect please give a correct user name',
          'string.min': 'the user name must be to have  least 3 caractere',
        }),
      phoneNumber: joi.string().required()
        //.pattern(/^\+{0,1}[0-9]{8,15}$/)
        .trim()
        .messages({
          'any.required': 'the phone number contact is required',
        }),
      ownerId: joi.number().integer().required().messages({
        'any.required': 'owner id is required',
      }),
    }).validate({
      ...req.body,
      ownerId: (req as RequestAuth).user.id,
    }, {
      allowUnknown: true
    });
    if (error) {
      res.status(400).json({ error: error, message: error.details.map(err => err.message).join('\n') });
      return;
    }

    try {
      const contact = await Contact.findByPk(req.params.id);
      if (!contact || contact.ownerId !== (req as RequestAuth).user.id) {
        res.status(404).json({ message: 'contact not found' });
        return;
      }

      console.log(contact.pathPhoto);
      if ((req.file && contact.pathPhoto) || req.body.photo === null) {
        deleteFile(contact.pathPhoto);
      }

      contact.name = data.name;
      contact.email = data.email ? data.email : data.email === null ? null : contact.email,
        contact.phoneNumber = data.phoneNumber;
      contact.extPhoto = req.file ?
        path.extname(req.file.filename)
        : data.photo === null ? null : contact.extPhoto;
      await contact.save();
      if (req.file) {
        await uploadFile(contact.pathPhoto, req.file);
      }

      res.json({
        message: 'The contact updated with success',
        contact: { ...contact.toJSON(), pathPhoto: undefined }
      })
    } catch (error) {
      res.status(500).json({ message: 'Error when update contact try again' });
      console.log(error);
      return;
    }
  },

  async destroy(req: Request, res: Response, next: NextFunction) {
    try {
      const contact = await Contact.findByPk(req.params.id);

      if (!contact || contact.ownerId !== (req as RequestAuth).user.id) {
        res.status(404).json({ message: 'contact not found' });
        return;
      }

      if (contact.pathPhoto) {
        deleteFile(contact.pathPhoto);
      }
      await Contact.destroy({ where: { id: req.params.id } });
      res.json({ message: 'The contact delete with success' });
    } catch (error) {
      res.status(500).json({ message: 'Error when delete contact try again' });
      console.log(error);
      return;
    }
  }
};

export default ContactController; 