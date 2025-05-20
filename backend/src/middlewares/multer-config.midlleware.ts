import multers, * as multer from 'multer';
import { ErrorRequestHandler, Request, RequestHandler } from 'express';
import * as path from 'path';
import * as fs from 'fs';

const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/jpeg': 'jpeg',
};

const folderUpload = path.resolve(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: (req: Request, file, callback) => {
    callback(null, folderUpload);
  },
  filename: (req, file, callback) => {
    const name = file.originalname.split(' ').join('_');
    const extension = path.extname(file.originalname);

    callback(null, name.replace(`${extension}`, `_${Date.now()}${extension}`));
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  cb(null, Object.keys(MIME_TYPES).includes(file.mimetype));
}

const uploader = multers({ storage, fileFilter });
const multerConfigMiddleware = {
  single(fieldname: string): RequestHandler {
    return uploader.single(fieldname);
  },

  cleanupUploadedFiles: (): RequestHandler => {
    return (req, res, next) => {
      const deleteFile = (file: Express.Multer.File) => {
        const filePath = path.join(folderUpload, file.filename);
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Erreur lors de la suppression de ${file.filename}:`, err);
          } else {
            console.log(`Fichier supprimé : ${file.filename}`);
          }
        });
      };

      res.on('finish', () => {
        // Fichier unique
        if (req.file) deleteFile(req.file);
        // Plusieurs fichiers
        if (req.files) {
          if (Array.isArray(req.files)) {
            req.files.forEach(deleteFile);
          } else {
            // Dans le cas de upload.fields()
            Object.values(req.files).flat().forEach(deleteFile);
          }
        }
      });

      next();
    }
  },

  errorUpload: (): ErrorRequestHandler => {
    return (err, req, res, next) => {
      console.log(err);
    }
  }
};

export default multerConfigMiddleware;
