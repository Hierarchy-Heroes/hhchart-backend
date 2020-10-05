
const express = require('express');
const router = express.Router();
const { validateLogin, emailInUse, matchPassword } = require('../validation');

router.post('/login', async (req, res) => {
    console.log(req.body);
    const { error } = validateLogin(req.body);
    if (error) {
        res.status(400).send(error.details[0].message);
    }

    const user = await emailInUse(req.body.email, res);
    console.log(user === null)
    if (!user) {
        res.status(401).send('user not found');
    }
    console.log(user)
    const passwordMatch = matchPassword(user.password, req.body.password); 
    console.log(passwordMatch)

    if (!passwordMatch) {
        res.status(401).send('invalid password'); 
    }
    res.send('Logged in!');
});

module.exports = router; 