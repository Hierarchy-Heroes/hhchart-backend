
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
    const employee = await findEmployee({ "_id": req.user._id }, res);
    if (!employee) {
        return res.status(404).send('Employee not found');
    }
    if (employee.isManager) {
        next();
    } else {
        return res.status(401).send('Operation is restricted to management');
    }
}

/**
 * checks if the employee has the target managerId as their ancestor 
 * @param {*} employee 
 * @param {*} target 
 */
const isAncestor = async (employee, target, res) => {
    if (employee.managerId === target) {
        return true; 
    }
    if (employee.managerId === -1) { // reached root 
        return false; 
    }
    const ancestor = await findEmployee({ "_id": employee.managerId }, res); 
    return isAncestor(ancestor, managerId, res);
} 


const verifyAncestor = async (req, res, next) => {
    const employee = req.body.employee;
    const manager = await findEmployee({ "_id": req.user._id }, res);
    
    const managerIsAncestor = await isAncestor(employee, manager._id, res);
}

module.exports.verifyToken = verifyToken;
module.exports.verifyManager = verifyManager;
module.exports.verifyAncestor = verifyAncestor;
