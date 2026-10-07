require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const logger = require('./middlewares/logger');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');
const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(logger);
app.get('/', (_req, res) => res.status(200).send('DefenseDesk API is running.'));
// Sa Vercel, siguraduhing nakakonekta muna ang MongoDB bago iproseso ang API request.
app.use('/api', (_req, _res, next) => {
  connectDB().then(() => next()).catch(next);
});
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));
app.use('/api/defenses', require('./routes/defenseRoutes'));
app.use('/api/evaluations', require('./routes/evaluationRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use(notFound);
app.use(errorHandler);

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => console.log(`DefenseDesk API listening at http://localhost:${port}`));
}

module.exports = app;
