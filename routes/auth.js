
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
    try {
        const hashedPassword = await bcrypt.hash(req.body.password,8)
        const user = await emailInUse(req.body.email, trimSpaces(req.body.companyName), res);

        if(!user)
        {
            res.body.password = hashedPassword;
            req.push({
                _id: req.body._id,
                _company: req.body.companyName
            })
        }

    }  catch {
        //Error in registration
        res.redirect('/register');
        res.json({message: "Error in registration"})
    }

    //Can now login on page
    res.redirect('/login');
})

//Clients logout from their side + cookie deletion
router.post('/logout', async (req, res) => {
    await logOut(req,res);
    req.session.destroy((err) => {
        res.clearCookie('connect.sid');
        res.json({message: "Logged out"})
    });
});

module.exports = router; 