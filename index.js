
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const bodyParser = require('body-parser');
require('dotenv/config');

// routes 
const employeeRoutes = require('./routes/employee');
const authRoutes = require('./routes/auth');

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send("Home Page");
});

app.use('/employee', employeeRoutes);
app.use('/auth', authRoutes);

mongoose.connect(
    process.env.MONGODB_URI,
    { useNewUrlParser: true },
    () => console.log("Connected to DB")
);

app.listen(3000);