
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const bodyParser = require('body-parser');
require('dotenv/config');

// routes
const employeeRoutes = require('./routes/employee');

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send("Hello we are on home");
});

app.use('/employees', employeeRoutes);

mongoose.connect(
    process.env.MONGODB_URI,
    { userNewUrlParser: true },
    () => console.log("connected to db")
);

app.listen(3000);
