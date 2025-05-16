// routes/profileRoutes.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import db from '../db/db.js';
import { getProfile, updateProfile, changePassword } from '../controllers/profileController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { profile } from 'console';

const router = express.Router();

// Создание папки uploads/avatars при необходимости
const avatarDir = 'uploads/avatars';
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

// Настройка multer для загрузки аватаров
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}_${Date.now()}${ext}`);
  }
});
const uploadAvatar = multer({ storage: avatarStorage });

// Получить профиль пользователя
router.get('/', authenticateToken, getProfile);

// Обновить профиль пользователя
router.put('/', authenticateToken, updateProfile);

// Сменить пароль
router.put('/password', authenticateToken, changePassword);

// Загрузить аватар
router.post('/avatar', authenticateToken, uploadAvatar.single('avatar'), async (req, res) => {
    try {
      const imagePath = req.file.filename; // имя файла, сохранённое multer'ом
      await db.query('UPDATE users SET profile_picture = ? WHERE id = ?', [imagePath, req.user.id]);
      
      // Отправляем правильный JSON-ответ
      res.json({ message: 'Аватар загружен', profilePicture: imagePath });
    } catch (err) {
      console.error('Ошибка загрузки аватара:', err);
      
      // Убедись, что ответ ещё не был отправлен
      if (!res.headersSent) {
        res.status(500).json({ message: 'Ошибка сервера' });
      }
    }
  });  

export default router;
