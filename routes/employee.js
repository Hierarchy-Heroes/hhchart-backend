const express = require('express');
const router = express.Router();

router.get('/:company', async (req, res) => {
    try {
        //TODO: modify collection name to get the company from the currently logged in user
        //pass in collection name (in this case, the company)
        const Employee = require('../models/Employee')(req.params.company);
        const employees = await Employee.find();
        res.json(employees);
    } catch (err) {
        res.json({ message : err });
    }
})

router.get('/employee/:employeeId', (req, res) => {
    res.send("We are looking at employee 1");
});

/* create a new employee */
router.post('/', async (req, res) => {
    //TODO: modify collection name to get the company from the currently logged in user
    //pass in collection name (in this case, the company)
    const Employee = require('../models/Employee')(req.body.companyName.replace(/\s/g,''));
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
        res.json({ message : err });
    }
})

module.exports = router;
