// controllers/profileController.js
import pool from '../db/db.js';
import bcrypt from 'bcryptjs';

export const getProfile = async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, full_name, email, role_id, profile_picture FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) return res.status(404).json({ message: 'Пользователь не найден.' });

    res.json(users[0]);
  } catch (error) {
    console.error('Ошибка получения профиля:', error);
    res.status(500).json({ message: 'Ошибка сервера.' });
  }
};

export const updateProfile = async (req, res) => {
  const { fullName, email } = req.body;
  try {
    await pool.query('UPDATE users SET full_name = ?, email = ? WHERE id = ?', [fullName, email, req.user.id]);
    res.json({ message: 'Профиль успешно обновлен.' });
  } catch (error) {
    console.error('Ошибка обновления профиля:', error);
    res.status(500).json({ message: 'Ошибка сервера.' });
  }
};

export const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const [users] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) return res.status(404).json({ message: 'Пользователь не найден.' });

    const user = users[0];
    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: 'Старый пароль неверный.' });

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedNewPassword, req.user.id]);

    res.json({ message: 'Пароль успешно изменён.' });
  } catch (error) {
    console.error('Ошибка смены пароля:', error);
    res.status(500).json({ message: 'Ошибка сервера.' });
  }
};
