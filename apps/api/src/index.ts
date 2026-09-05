import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import healthRouter from './routes/health.js';
import authRouter from './auth/auth.routes.js';
import adminRouter from './admin/admin.routes.js';
import catalogueRouter from './catalogue/catalogue.routes.js';
import productsRouter from './products/products.routes.js';
import cartRouter from './cart/cart.routes.js';
import ordersRouter from './orders/orders.routes.js';
import paymentsRouter from './payments/payments.routes.js';
import analyticsRouter from './analytics/analytics.routes.js';
import wishlistRouter from './wishlist/wishlist.routes.js';
import reviewsRouter from './reviews/reviews.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { env } from './config/env.js';

const app: Express = express();
const PORT = env.port;

app.use(helmet());
app.use(cors({
  origin: env.frontendUrl,
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({
  verify: (req, _res, buffer) => {
    (req as typeof req & { rawBody?: Buffer }).rawBody = Buffer.from(buffer);
  },
}));

app.use('/api/health', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1', catalogueRouter);
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/orders', ordersRouter);
app.use('/api/v1/payments', paymentsRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/wishlist', wishlistRouter);
app.use('/api/v1', reviewsRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;