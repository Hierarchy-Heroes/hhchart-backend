
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
    if (!user) {
        res.status(401).send('user not found');
    }
    const passwordMatch = matchPassword(user.password, req.body.password); 

    if (!passwordMatch) {
        res.status(401).send('invalid password'); 
    }

    // create and assign token to current user 


    res.send('Logged in!');
});

router.post('/logout', async (res, res) => {
    // relinquish token 
});

module.exports = router; 