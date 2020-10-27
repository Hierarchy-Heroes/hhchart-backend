
// const express = require('express'); 
const jwt = require('jsonwebtoken');
const { trimSpaces } = require('./misc/helper');
const { findEmployee } = require('./interface/IEmployee');

const verifyToken = (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) {
        return res.status(401).send('Access Denied');
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).send('Invalid Token');
    }
};

const verifyManager = async (req, res, next) => {
    const employee = await findEmployee({ "_id": req.user._id },
        trimSpaces(req.user._company), res);
    if (!employee) {
        return res.status(404).send('Employee not found');
    }
    if (employee.isManager) {
        next();
    } else {
        return res.status(401).send('Operation is restricted to management');
    }
}

module.exports.verifyToken = verifyToken;
module.exports.verifyManager = verifyManager;