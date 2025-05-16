import express from 'express';
import db from '../db/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Получить всех зарегистрированных пользователей (для библиотекаря)
router.get('/readers', authenticateToken, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Не авторизован' });
  if (req.user.role_id !== 3) return res.status(403).json({ message: 'Нет доступа' });

  try {
    const [rows] = await db.query('SELECT id, full_name, email FROM users WHERE role_id = 2');
    res.json(rows);
  } catch (error) {
    console.error('Ошибка получения списка пользователей:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Оформить аренду книги
router.post('/rentals', authenticateToken, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Не авторизован' });
  if (req.user.role_id !== 3) return res.status(403).json({ message: 'Нет доступа' });

  const { user_id, book_id, return_date, payment_method } = req.body;

  if (!user_id || !book_id || !return_date || !payment_method) {
    return res.status(400).json({ message: 'Все поля должны быть заполнены' });
  }

  try {
    const [[book]] = await db.query('SELECT rental_stock FROM books WHERE id = ?', [book_id]);

    if (!book || book.rental_stock <= 0) {
      return res.status(400).json({ message: 'Книга недоступна для аренды' });
    }

    await db.query(`
      INSERT INTO rentals (user_id, book_id, rental_date, return_date, status, payment_method)
      VALUES (?, ?, NOW(), ?, 'active', ?)
    `, [user_id, book_id, return_date, payment_method]);

    await db.query('UPDATE books SET rental_stock = rental_stock - 1 WHERE id = ?', [book_id]);
    await db.query('UPDATE books SET rentable = rental_stock > 0 WHERE id = ?', [book_id]);

    res.json({ message: 'Аренда оформлена' });
  } catch (error) {
    console.error('Ошибка оформления аренды:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить активные аренды конкретного пользователя (по ID)
router.get('/rentals/user/:user_id', authenticateToken, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Не авторизован' });

  try {
    const [rows] = await db.query(`
      SELECT rentals.*, books.title AS book_title
      FROM rentals
      JOIN books ON rentals.book_id = books.id
      WHERE rentals.user_id = ? AND rentals.status = 'active'
    `, [req.params.user_id]);

    res.json(rows);
  } catch (error) {
    console.error('Ошибка получения аренды:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить аренды текущего пользователя
router.get('/my-rentals', authenticateToken, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Не авторизован' });

  try {
    const [rows] = await db.query(`
      SELECT rentals.*, books.title AS book_title
      FROM rentals
      JOIN books ON rentals.book_id = books.id
      WHERE rentals.user_id = ? AND rentals.status = 'active'
    `, [req.user.id]);

    res.json(rows);
  } catch (error) {
    console.error('Ошибка получения аренд:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Закрыть аренду книги
router.put('/rentals/:id/close', authenticateToken, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Не авторизован' });
  if (req.user.role_id !== 3) return res.status(403).json({ message: 'Нет доступа' });

  try {
    await db.query(`UPDATE rentals SET status = 'returned' WHERE id = ?`, [req.params.id]);

    await db.query(`
      UPDATE books
      SET rental_stock = rental_stock + 1,
          rentable = rental_stock + 1 > 0
      WHERE id = (SELECT book_id FROM rentals WHERE id = ?)
    `, [req.params.id]);

    res.json({ message: 'Аренда закрыта' });
  } catch (error) {
    console.error('Ошибка закрытия аренды:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;
