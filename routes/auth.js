
const nodemailer = require('nodemailer');
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { validateLogin, emailInUse} = require('../validation');
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

    const passwordMatch = await bcrypt.compare(req.body.password,user.password);

    if (!passwordMatch) {
        res.status(401).send('invalid password');
    }

    let userSignature = {
        _id: user._id
    };

    sendEmail();

    // create and assign token to current user 
    const token = jwt.sign(userSignature, process.env.JWT_SECRET, { expiresIn: "2h" });
    res.header('auth-token', token).send(token);
});

function sendEmail() 
{
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'testingorgchart@gmail.com',
          pass: 'pa33word'
        }
      });

    var mailOptions = {
    from: 'testingorgchart@gmail.com',
    to: 'venturanotes@gmail.com',
    subject: 'Whud up my brother from another mother',
    text: 'Hello'
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
}

router.post('/register', async (req, res) => {
    // TODO 
})

router.post('/logout', async (req, res) => {
    // TODO 
});

module.exports = router;
