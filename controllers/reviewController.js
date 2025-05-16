import pool from '../db/db.js';

// Определяем объект Review (вместо импорта из `db.js`)
const Review = {
  async findAllByBook(bookId) {
    const [reviews] = await pool.query(
      'SELECT r.*, u.full_name, u.profile_picture FROM reviews r INNER JOIN users u ON r.user_id = u.id WHERE r.book_id = ?',
      [bookId]
    );
    return reviews;
  },

  async createReview({ user_id, book_id, rating, pros, cons, comment, image }) {
    const [result] = await pool.query(
      'INSERT INTO reviews (user_id, book_id, rating, pros, cons, comment, image) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user_id, book_id, rating, pros, cons, comment, image]
    );
    return { id: result.insertId, user_id, book_id, rating, pros, cons, comment, image };
  }
};

const getReviewsByBook = async (req, res) => {
  const { bookId } = req.params;

  try {
    console.log("📚 Ищем отзывы для книги ID:", bookId);
    const reviews = await Review.findAllByBook(bookId);

    const SERVER_URL = process.env.SERVER_URL || "http://localhost:3000"; // ✅ Убедимся, что URL сервера загружается

    const formattedReviews = reviews.map((review) => ({
      id: review.id,
      full_name: review.full_name?.split(" ").slice(0, 2).join(" ") || "Неизвестный пользователь", // ✅ Имя и фамилия
      user_avatar: review.profile_picture ? `${SERVER_URL}/uploads/avatars/${review.profile_picture}` : null, // ✅ Корректный путь к аватару
      rating: review.rating,
      pros: review.pros,
      cons: review.cons,
      comment: review.comment,
      image: review.image ? `${SERVER_URL}/uploads/reviews/${review.image}` : null, // ✅ Корректный путь к фото отзыва
    }));

    console.log("✅ Отправляем отзывы:", formattedReviews);
    res.json({ reviews: formattedReviews });

  } catch (error) {
    console.error("❌ Ошибка получения отзывов:", error);
    res.status(500).json({ message: "Ошибка сервера при получении отзывов" });
  }
};


const createReview = async (req, res) => {
    console.log("🔍 Запрос на добавление отзыва получен!");
  
    if (!req.user) {
      console.error("❌ Ошибка: Пользователь не определен!");
      return res.status(401).json({ message: "Ошибка: Неавторизованный пользователь." });
    }
  
    const { rating, pros, cons, comment, book_id } = req.body;
    const user_id = req.user.id;
    const image = req.file ? req.file.filename : null;
  
    try {
      console.log("👤 Получаем данные пользователя...");
      const [userData] = await pool.query(
        "SELECT full_name, profile_picture FROM users WHERE id = ?", [user_id]
      );
  
      if (!userData.length || !userData[0]) {
        console.error("❌ Ошибка: Пользователь не найден!");
        return res.status(404).json({ message: "Ошибка: Пользователь не найден." });
      }
  
      const full_name = userData[0]?.full_name || "Неизвестный пользователь";
      const profile_picture = userData[0]?.profile_picture || null;
  
      console.log("📝 Создаем новый отзыв...");
      const reviewData = { user_id, book_id, rating, pros, cons, comment, image };
      const newReview = await Review.createReview(reviewData);
  
      console.log("✅ Отзыв успешно создан! ID:", newReview.id);
  
      const SERVER_URL = process.env.SERVER_URL || "http://localhost:3000"; // ✅ Фикс `undefined`

      const avatarPath = profile_picture ? `${SERVER_URL}/uploads/avatars/${profile_picture}` : null;
      const imagePath = newReview.image ? `${SERVER_URL}/uploads/reviews/${newReview.image}` : null;
      
      console.log("👤 Финальный путь к аватару:", avatarPath);
      console.log("📸 Финальный путь к отзыву:", imagePath);
  
      console.log("🖼 Проверка путей к изображениям:");
      console.log("👤 Аватар (из базы):", profile_picture);
      console.log("📸 Фото отзыва (из базы):", newReview.image);
  
      res.json({
        id: newReview.id,
        full_name: full_name,
        user_avatar: avatarPath,
        rating: newReview.rating,
        pros: newReview.pros,
        cons: newReview.cons,
        comment: newReview.comment,
        image: imagePath,
      });
  
    } catch (error) {
      console.error("❌ Ошибка сохранения отзыва:", error);
      res.status(500).json({ message: "Ошибка сервера при добавлении отзыва." });
    }
  };
  
  
export { getReviewsByBook, createReview };
