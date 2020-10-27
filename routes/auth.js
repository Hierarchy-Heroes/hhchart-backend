
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { validateLogin, emailInUse, matchPassword } = require('../validation');
const { trimSpaces } = require('../misc/helper');

router.post('/login', async (req, res) => {
    const { error } = validateLogin(req.body);
    if (error) {
        res.status(400).send(error.details[0].message);
    }

    const user = await emailInUse(req.body.email, trimSpaces(req.body.companyName), res);
    if (!user) {
        return res.status(401).send('user not found');
    }

    const passwordMatch = matchPassword(req.body.password, user.password);

    if (!passwordMatch) {
        res.status(401).send('invalid password');
    }

    let userSignature = {
        _id: user._id, 
        _company: user.companyName  
    };

    // create and assign token to current user 
    const token = jwt.sign(userSignature, process.env.JWT_SECRET, { expiresIn: "2h" });
    res.header('auth-token', token).send(token);
});

router.post('/register', async (req, res) => {
    // TODO 
})

router.post('/logout', async (req, res) => {
    // TODO 
});

module.exports = router; 