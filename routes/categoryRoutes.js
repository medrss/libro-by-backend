import express from 'express';
import db from '../db/db.js';

const router = express.Router();

// 📌 Получение всех категорий
router.get('/', async (req, res) => {
  try {
    const [categories] = await db.query('SELECT * FROM categories');
    res.json(categories);
  } catch (error) {
    console.error('Ошибка получения категорий:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;
