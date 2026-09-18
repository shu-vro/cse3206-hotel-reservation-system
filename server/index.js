import express from 'express';
import authRoutes from './routes/auth.js';

const app = express();

app.use(express.json());

app.use('/api/auth', authRoutes);

app.use('/api', (req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something broke on the server.' });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
