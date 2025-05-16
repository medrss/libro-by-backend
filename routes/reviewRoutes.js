import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { getReviewsByBook, createReview } from '../controllers/reviewController.js';

const router = express.Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url)); // ✅ Определяем `__dirname` для ES-модулей

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/reviews')); // ✅ Теперь путь работает!
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.get('/book/:bookId', getReviewsByBook);
router.post('/', authenticateToken, upload.single('image'), createReview);

export default router;

