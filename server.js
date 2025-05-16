import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import rentalRoutes from './routes/rentals.js';
import bookRoutes from './routes/bookRoutes.js'; 
import reviewRoutes from './routes/reviewRoutes.js'; 
import categoryRoutes from './routes/categoryRoutes.js';
import cartRoutes from './routes/cartRoutes.js'; 
import rentalRequestRoutes from './routes/rentalRequests.js';

dotenv.config();
const app = express();

// Middleware
app.use(cors({
origin: ['https://medrss.github.io'],
  credentials: true
}));
app.use(express.json());

process.on('uncaughtException', (err) => {
  console.error('Необработанная ошибка:', err);
});

// Роуты
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api', rentalRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/uploads/avatars', express.static('uploads/avatars'));
app.use('/uploads/reviews', express.static('uploads/reviews'));
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/rental-requests', rentalRequestRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
