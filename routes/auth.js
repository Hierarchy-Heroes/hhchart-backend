
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { validateLogin, emailInUse, matchPassword } = require('../validation');
const { trimSpaces } = require('../misc/helper');

router.post('/login', async (req, res) => {
    const { error } = validateLogin(req.body);
    if (error) {
        res.status(400).send(error.details[0].message);
    }

    const user = await emailInUse(req.body.email, res);
    if (!user) {
        return res.status(401).send('user not found');
    }

    bcrypt.compare(req.body.password,user.password, (err, result) => {
        if (err) {
            res.status(401).send('Something went wrong comparing passwords');
        }
        if (result) {
            let userSignature = {
                _id: user._id
            };
            // create and assign token to current user 
            const token = jwt.sign(userSignature, process.env.JWT_SECRET, { expiresIn: "2h" });
            res.header('auth-token', token).send(token);
        } else {
            res.status(401).send('Invalid Password');
        }
    });
});

router.post('/register', async (req, res) => {
    // TODO 
})

router.post('/logout', async (req, res) => {
    // TODO 
});

module.exports = router;
