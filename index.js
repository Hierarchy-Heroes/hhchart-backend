
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const bodyParser = require('body-parser');
const timeout = require('connect-timeout');
require('dotenv/config');

// routes
const employeeRoutes = require('./routes/employee');
const authRoutes = require('./routes/auth');

// Checks to see if the request has timed out
const haltOnTimedout = (req, res, next) => {
  if (!req.timedout) {
    next();
  }
}

// timeout of 2 minutes
app.use(timeout(120000));

app.use(bodyParser.json());
app.use(haltOnTimedout);

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, auth-token');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

app.use('/employees', employeeRoutes);
app.use('/auth', authRoutes);

mongoose.connect(
  process.env.MONGODB_URI,
  { useNewUrlParser: true },
  () => console.log("Connected to DB")
);

app.listen(3000);

module.exports = app;
