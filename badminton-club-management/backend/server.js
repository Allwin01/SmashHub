require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Debug output
console.log('Attempting to connect to MongoDB...');

// Modern connection with fallback for older Mongoose versions
const mongooseOptions = mongoose.version >= '7.0.0' ? {} : { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
};

mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI, mongooseOptions)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    
    // Test route
    app.get('/', (req, res) => {
      res.json({ 
        status: 'running',
        database: 'connected',
        message: 'Badminton Club API is ready!' 
      });
    });

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('\nTroubleshooting:');
    console.log('1. Verify MongoDB is running: brew services list | grep mongodb');
    console.log('2. Check connection string: mongosh "' + (process.env.MONGO_URI || process.env.MONGODB_URI) + '"');
  });

/*
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('Badminton Club API is running!');
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
});

*/
