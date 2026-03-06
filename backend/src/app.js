const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const adminRoutes = require('./routes/adminRoutes');
const workerRoutes = require('./routes/workerRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const productRoutes = require('./routes/productRoutes');
const quotationRoutes = require('./routes/quotationRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const leadRoutes = require('./routes/leadRoutes');
const installationRoutes = require('./routes/installationRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const productController = require('./controllers/productController');
const authMiddleware = require('./middleware/authMiddleware');
const portfolioController = require('./controllers/portfolioController');

const app = express();

// Middleware
app.use(express.json());

const allowedOrigins =[
        "https://sree84s.site",
        "http://sree84s.site",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://192.168.0.103:8080",
      ];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.filter(Boolean).includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));
app.use(helmet());
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
}

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health Check Route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/worker', workerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.get('/api/public/portfolio', portfolioController.getPublicPortfolio);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/admin/expenses', require('./routes/expenseRoutes'));
app.use('/api/telegram', require('./routes/telegramRoutes'));
app.use('/api/feedback', feedbackRoutes);
app.use('/api/products', productRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/installations', installationRoutes);
app.use('/api/workflow', workflowRoutes);
app.get('/api/catalog/search', authMiddleware, productController.catalogSearch);
app.get('/api/items/search', authMiddleware, productController.catalogSearch);

// Error handling middleware (optional but recommended)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = app;
