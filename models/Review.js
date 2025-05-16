import db from '../db/db.js'; // ✅ Подключаем базу данных

const Review = {
  async findAllByBook(bookId) {
    const [reviews] = await db.pool.query(
      'SELECT r.*, u.full_name, u.profile_picture FROM reviews r INNER JOIN users u ON r.user_id = u.id WHERE r.book_id = ?',
      [bookId]
    );
    return reviews;
  },

  async createReview({ user_id, book_id, rating, pros, cons, comment, image }) {
    const [result] = await db.pool.query(
      'INSERT INTO reviews (user_id, book_id, rating, pros, cons, comment, image) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user_id, book_id, rating, pros, cons, comment, image]
    );
    return { id: result.insertId, user_id, book_id, rating, pros, cons, comment, image };
  }
};

export default Review;
