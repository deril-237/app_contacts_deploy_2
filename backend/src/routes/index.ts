import express from 'express';
import AuthController from '../controllers/auth.controller';
import AuthMiddleware from '../middlewares/auth.middleware';
import ContactController from '../controllers/contacts.controller';
import multerConfigMiddleware from '../middlewares/multer-config.midlleware';
import errorMidlleware from '../middlewares/5xx.middleware';


export const router = express.Router();
router.get('/', (req, res) => { res.send('ok') });

// authentiification route 
// router.use(multerConfigMiddleware.cleanupUploadedFiles());
router.post('/login', AuthController.login);
router.post('/create-account', AuthController.createAccount);
router.post('/verify-otp-code', AuthController.verifyOtpCode);
router.post('/recovery-password', AuthController.getNewPassword);
// router.post('/refresh-token', AuthController.refreshToken);
// router.post('/resendotp', AuthController.resendOtpCode);

// contact routes
router.post('/contacts',
  multerConfigMiddleware.single('photo'),
  multerConfigMiddleware.cleanupUploadedFiles(),
  AuthMiddleware.authen,
  ContactController.add
);
router.put('/contacts/:id',
  multerConfigMiddleware.single('photo'),
  multerConfigMiddleware.cleanupUploadedFiles(),
  AuthMiddleware.authen,
  ContactController.update
);
router.get('/contacts', AuthMiddleware.authen, ContactController.getAll);
router.delete('/contacts/:id', AuthMiddleware.authen, ContactController.destroy);

router.use(errorMidlleware); 