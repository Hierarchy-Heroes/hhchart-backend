
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const bodyParser = require('body-parser');
const timeout = require('connect-timeout');
require('dotenv/config');

// routes
const employeeRoutes = require('./routes/employee');
const authRoutes = require('./routes/auth');

//timeout of 2 minutes
app.use(timeout(120000));

app.use(bodyParser.json());
app.use(haltOnTimedout);

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, auth-token');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});
app.use(haltOnTimedout);

app.get('/', (req, res) => {
    res.send('Home Page');
});

app.use('/employees', employeeRoutes);
app.use(haltOnTimedout);

app.use('/auth', authRoutes);
app.use(haltOnTimedout);

mongoose.connect(
    process.env.MONGODB_URI,
    { useNewUrlParser: true },
    () => console.log("Connected to DB")
);

//Checks to see if the request has timed out
function haltOnTimedout(req, res, next) {
    if(!req.timedout) next();
}

app.listen(3000);
