require('dotenv').config();
const app = require('./app');
const { initCronJobs } = require('./utils/cronJobs');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);

    // Initialize scheduled tasks
    initCronJobs();
});
