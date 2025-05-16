import express from 'express';
import db from '../db/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Настройка `multer` для хранения изображений книг
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/books'); // Папка для загруженных изображений
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Уникальное имя файла
  }
});

const upload = multer({ storage });

// 📌 API для добавления книги с изображением и категориями
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  if (req.user.role_id !== 1) return res.status(403).json({ message: 'Нет доступа' });

  const { title, author, year, price, stock, rental_stock, description, categories } = req.body;
  const available = req.body.available === '1' ? 1 : 0;
  const rentable = req.body.rentable === '1' ? 1 : 0;
  const imagePath = req.file ? `/uploads/books/${req.file.filename}` : null;

  if (!title || !author || !year || !price || description === undefined) {
    return res.status(400).json({ message: 'Все поля должны быть заполнены' });
  }

  try {
    // Добавляем книгу
    const [result] = await db.query(`
      INSERT INTO books (title, author, year, price, available, rentable, stock, rental_stock, image, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [title, author, year, price, available, rentable, stock, rental_stock, imagePath, description]);

    const bookId = result.insertId;

    // Добавляем категории книги
    if (categories) {
      const parsedCategories = JSON.parse(categories);
      if (Array.isArray(parsedCategories) && parsedCategories.length > 0) {
        const categoryValues = parsedCategories.map(categoryId => [bookId, categoryId]);
        await db.query('INSERT INTO book_categories (book_id, category_id) VALUES ?', [categoryValues]);
      }
    }

    res.json({ message: 'Книга добавлена', image: imagePath });
  } catch (error) {
    console.error('Ошибка добавления книги:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/', async (req, res) => {
    try {
      const [books] = await db.query(`
        SELECT books.*, 
               COALESCE(GROUP_CONCAT(categories.name), '') AS categories
        FROM books
        LEFT JOIN book_categories ON books.id = book_categories.book_id
        LEFT JOIN categories ON book_categories.category_id = categories.id
        GROUP BY books.id
      `);
  
      // ✅ Преобразуем строку категорий в массив
      const formattedBooks = books.map(book => ({
        ...book,
        categories: book.categories ? book.categories.split(', ') : []
      }));
  
      res.json(formattedBooks);
    } catch (error) {
      console.error('Ошибка получения книг:', error);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  });
  

// 📌 Получение книги по ID
router.get('/:id', async (req, res) => {
  try {
    const [book] = await db.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
    if (book.length === 0) return res.status(404).json({ message: 'Книга не найдена' });
    res.json(book[0]);
  } catch (error) {
    console.error('Ошибка получения книги:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/search/:query', async (req, res) => {
    try {
      const query = `%${req.params.query}%`;
      const [books] = await db.query('SELECT id, title FROM books WHERE title LIKE ?', [query]);
      res.json(books);
    } catch (error) {
      console.error('Ошибка поиска книг:', error);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  });
  

export default router;
