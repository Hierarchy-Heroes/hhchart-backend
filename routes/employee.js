
const express = require('express');
const router = express.Router();
const multer = require('multer');
const bcrypt = require('bcryptjs');
const fs = require("fs")
const { verifyToken, verifyManager } = require('../verification');
const { validateEmployee, emailInUse } = require('../validation');

//Multer storage
//Reference: https://code.tutsplus.com/tutorials/file-upload-with-multer-in-node--cms-32088
//A folder named "uploads" must exist in directory.
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads");
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now());
    }
});

const upload = multer({ storage: storage })

router.get('/:companyName', verifyToken, verifyManager, async (req, res) => {
    try {
        //passes in collection name (in this case, the company)
        //TODO: modify collection name to get the company from the currently logged in user
        const Employee = require('../models/Employee')(req.params.companyName);
        const employees = await Employee.find();
        res.json(employees);
    } catch (err) {
        res.json({
            message: err
        });
    }
});

router.get('/employee/:employeeId', (req, res) => {
    res.send("We are looking at employee 1");
});

/**
Parses uploaded JSON file and imports all employee data to company's collection.
The data POSTed must be of type multipart/form-data and the form field name for the file input
must be "employeeJSON". A "company" field is also required with the name of the company the data belongs to.
*/

router.post('/import', upload.single("employeeJSON"), async (req, res) => {
    //if the company name is missing
    if (req.body.company == undefined) {
        res.status(400).send("Missing company name.");
        fs.unlinkSync(req.file.path);
        return;
    }

    //passes in collection name (in this case, the company)
    const Employee = require('../models/Employee')(req.body.company.replace(/\s/g, ''));

    let response = "Employees uploaded successfully."
    fs.readFile(req.file.path, async function (err, data) {
        const str = String.fromCharCode.apply(String, data);
        const employees = JSON.parse(data);

        for (i in employees) {
            const employeeObj = createEmployee(Employee, employees[i]);

            try {
                const savedEmployee = await employeeObj.save();
            } catch (err) {
                response = err.message;
            }
        }
    });

    //send a response back
    res.json({ "message": response });

    //delete uploaded file after importing data
    fs.unlinkSync(req.file.path);

});

/* create a new employee */
router.post('/', async (req, res) => {
    console.log("hello world")
    const { error } = validateEmployee(req.body);

    if (error) {
        res.status(400).send(error.details[0].message);
    }

    const credentialsExists = await emailInUse(req.body.email, req.body.companyName, res);
    if (credentialsExists) {
        res.status(400).send('credential already in use');
    }

    // encrypt password 
    bcrypt.hash(req.body.password, 10, async (err, hash) => {
        if (err) {
            res.send("password encryption failed");
        }
        req.body.password = hash;

        const Employee = require('../models/Employee')(req.body.companyName.replace(/\s/g, ''));
        const newEmployee = createEmployee(Employee, req.body);

        try {
            const savedEmployee = await newEmployee.save();
            res.json(savedEmployee);
        } catch (err) {
            res.json({
                message: err
            });
        }
    });
});

const createEmployee = (Employee, employeeData) => {
    const employeeObj = new Employee({
        firstName: employeeData.firstName,
        lastName: employeeData.lastName,
        companyId: employeeData.companyId,
        password: employeeData.password,
        positionTitle: employeeData.positionTitle,
        companyName: employeeData.companyName,
        isManager: employeeData.isManager,
        employeeId: employeeData.employeeId,
        email: employeeData.email,
        startDate: employeeData.startDate,
    });
    return employeeObj;
}

module.exports = router;
