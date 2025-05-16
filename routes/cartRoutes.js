import express from 'express';
import db from '../db/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();
router.post('/add', authenticateToken, async (req, res) => {
  const { book_id, quantity } = req.body;

  if (!book_id || quantity < 1) {
    return res.status(400).json({ message: "Неверные данные" });
  }

  try {
    // 📌 Проверяем, есть ли товар в корзине пользователя
    const [[existingItem]] = await db.query(
      'SELECT * FROM cart WHERE user_id = ? AND book_id = ?',
      [req.user.id, book_id]
    );

    if (existingItem) {
      // 📌 Если товар уже есть, увеличиваем количество
      await db.query(
        'UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND book_id = ?',
        [quantity, req.user.id, book_id]
      );
      res.json({ message: "Количество товара обновлено!" });
    } else {
      // 📌 Если товара нет, добавляем его
      await db.query(
        'INSERT INTO cart (user_id, book_id, quantity) VALUES (?, ?, ?)',
        [req.user.id, book_id, quantity]
      );
      res.json({ message: "Товар добавлен в корзину!" });
    }
  } catch (error) {
    console.error("Ошибка добавления в корзину:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});


// 📌 Получение корзины пользователя
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [cart] = await db.query(`
      SELECT cart.*, books.title, books.price, books.image
      FROM cart
      JOIN books ON cart.book_id = books.id
      WHERE cart.user_id = ?
    `, [req.user.id]);

    res.json(cart);
  } catch (error) {
    console.error("Ошибка получения корзины:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

// 📌 Обновление количества книг в корзине
router.put('/update', authenticateToken, async (req, res) => {
  const { book_id, quantity } = req.body;
  if (!book_id || quantity < 1) return res.status(400).json({ message: "Некорректные данные" });

  try {
    await db.query(`UPDATE cart SET quantity = ? WHERE user_id = ? AND book_id = ?`, [quantity, req.user.id, book_id]);
    res.json({ message: "Количество обновлено" });
  } catch (error) {
    console.error("Ошибка обновления количества:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

// 📌 Удаление книги из корзины
router.delete('/remove', authenticateToken, async (req, res) => {
  const { book_id } = req.body;
  if (!book_id) return res.status(400).json({ message: "Некорректные данные" });

  try {
    await db.query(`DELETE FROM cart WHERE user_id = ? AND book_id = ?`, [req.user.id, book_id]);
    res.json({ message: "Книга удалена из корзины" });
  } catch (error) {
    console.error("Ошибка удаления из корзины:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

export default router;
