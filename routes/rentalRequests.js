import express from 'express';
import db from '../db/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// 📌 **Пользователь отправляет запрос на аренду**
router.post('/', authenticateToken, async (req, res) => {
  const { book_id, requested_return_date } = req.body;

  if (!req.user) return res.status(401).json({ message: 'Не авторизован' });
  if (!book_id || !requested_return_date) return res.status(400).json({ message: 'Все поля должны быть заполнены' });

  try {
    await db.query(`
      INSERT INTO rental_requests (user_id, book_id, requested_return_date, status)
      VALUES (?, ?, ?, 'pending')
    `, [req.user.id, book_id, requested_return_date]);

    res.json({ message: 'Запрос на аренду отправлен' });
  } catch (error) {
    console.error('Ошибка создания запроса:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// 📌 **Библиотекарь видит запросы**
router.get('/', authenticateToken, async (req, res) => {
  if (req.user.role_id !== 3) return res.status(403).json({ message: 'Нет доступа' });

  try {
    const [requests] = await db.query(`
      SELECT rental_requests.*, users.full_name AS user_name, books.title AS book_title
      FROM rental_requests
      JOIN users ON rental_requests.user_id = users.id
      JOIN books ON rental_requests.book_id = books.id
      WHERE rental_requests.status = 'pending'
    `);

    res.json(requests);
  } catch (error) {
    console.error('Ошибка получения запросов:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// 📌 **Библиотекарь принимает или отклоняет запрос**
router.put('/:id', authenticateToken, async (req, res) => {
  if (req.user.role_id !== 3) return res.status(403).json({ message: 'Нет доступа' });

  const { status } = req.body;
  if (!['approved', 'denied'].includes(status)) return res.status(400).json({ message: 'Некорректный статус' });

  try {
    await db.query(`UPDATE rental_requests SET status = ? WHERE id = ?`, [status, req.params.id]);

    if (status === 'approved') {
      const [[request]] = await db.query(`SELECT * FROM rental_requests WHERE id = ?`, [req.params.id]);
      await db.query(`
        INSERT INTO rentals (user_id, book_id, rental_date, return_date, status, payment_method)
        VALUES (?, ?, NOW(), ?, 'active', 'in_store')
      `, [request.user_id, request.book_id, request.requested_return_date]);
    }

    res.json({ message: `Запрос ${status === 'approved' ? 'подтвержден' : 'отклонен'}` });
  } catch (error) {
    console.error('Ошибка обновления запроса:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;
