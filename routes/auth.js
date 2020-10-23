
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { validateLogin, emailInUse, matchPassword } = require('../validation');

router.post('/login', async (req, res) => {
    const { error } = validateLogin(req.body);
    if (error) {
        res.status(400).send(error.details[0].message);
    }

    const user = await emailInUse(req.body.email, req.body.companyName.replace(/\s/g, ''), res);
    if (!user) {
        res.status(401).send('user not found');
    }

    const passwordMatch = matchPassword(req.body.password, user.password);

    if (!passwordMatch) {
        res.status(401).send('invalid password');
    }

    // create and assign token to current user 
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "2h" });
    console.log(token);
    res.header('auth-token', token).send(token);
});

router.post('/register', async (req, res) => {
    // TODO 
})

router.post('/logout', async (req, res) => {
    // TODO 
});

module.exports = router; 