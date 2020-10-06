
const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const { verifyToken, verifyManager } = require('../verification')
const { validateEmployee, emailInUse } = require('../validation');

router.get('/', verifyToken, verifyManager, async (req, res) => {
    try {
        const employees = await Employee.find();
        res.json(employees);
    } catch (err) {
        res.json({
            message: err
        });
    }
});

// TODO: refactor this to make it more modular 

/* create a new employee */
router.post('/', verifyToken, async (req, res) => {

    const { error } = validateEmployee(req.body);
    if (error) {
        res.status(400).send(error.details[0].message);
    }

    const credentialsExists = await emailInUse(req.body.email, res);
    if (credentialsExists) {
        res.status(400).send('credential already in use'); 
    }

    // encrypt password 

    const newEmployee = new Employee({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        companyId: req.body.companyId,
        password: req.body.password,
        positionTitle: req.body.positionTitle,
        companyName: req.body.companyName,
        isManager: req.body.isManager,
        employeeId: req.body.employeeId,
        email: req.body.email,
        startDate: req.body.startDate,
    });

    try {
        const savedEmployee = await newEmployee.save();
        res.json(savedEmployee);
    } catch (err) {
        res.json({
            message: err
        });
    }
}); 

module.exports = router;