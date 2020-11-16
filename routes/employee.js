
const express = require('express');
const router = express.Router();
const multer = require('multer');
const bcrypt = require('bcryptjs');
const fs = require("fs")
const jwt = require('jsonwebtoken');
const { verifyToken, verifyManager } = require('../verification');
const { validateEmployee, emailInUse } = require('../validation');
const { createTree, sanitizeJSON } = require('../treeConstruction');
const { findEmployee, updateEmployee, removeEmployee, createEmployee } = require('../interface/IEmployee');
const { trimSpaces } = require('../misc/helper');

global.treeCache = undefined; 
global.flatCache = undefined; 

//Multer storage
//Reference: https://code.tutsplus.com/tutorials/file-upload-with-multer-in-node--cms-32088
//A folder named "uploads" must exist in directory.
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads");
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now());
    }
});

const updateCaches = async () => {
    console.log("updating caches");
    const Employee = require('../models/Employee'); 
    const employees = await Employee.find(); 

    global.flatCache = employees; 
    global.treeCache = createTree(sanitizeJSON(employees), Employee); 
}

const upload = multer({ storage: storage });

router.get('/tree', verifyToken, async (req, res) => {
    try {
        const Employee = require('../models/Employee');
        const employees = await Employee.find();
        let treeData; 
        if (global.treeCache !== undefined) {
            treeData = global.treeCache; 
        } else {
            treeData = createTree(sanitizeJSON(employees), Employee);
            global.treeCache = treeData; 
        }
        res.json(treeData);
    } catch (err) {
        res.json({
            message: err.message
        });
    }
});

/* Employees with images will have an "img" attribute which has a "buffer" field
* containing a "data" field that stores byte array of the image. In order to display the image,
* employee.img.buffer.data must be converted to a base64 string.
* Then you can set img.src to "data:image/png;base64," + {base64 image string}
*/
router.get('/flat', verifyToken, async (req, res) => {
    try {
        const Employee = require('../models/Employee');
        let employees; 
        if (global.flatCache !== undefined) {
            employees = global.flatCache; 
        } else {
            employees = await Employee.find();    
            global.flatCache = employees; 
        }
        res.json(employees);
    } catch (err) {
        res.json({
            message: err
        });
    }
});

/* create a new employee */
router.post('/add', verifyToken, verifyManager, async (req, res) => {
    //if manager id is missing, set to -1
    if (req.body.managerId == undefined) {
        req.body.managerId = Number(-1);
    }

    const { error } = validateEmployee(req.body);

    if (error) {
        return res.status(400).send(error.details[0].message);
    }

    const credentialsExists = await emailInUse(req.body.email, res);

    if (credentialsExists) {
        return res.status(400).send("User: " + req.body.email + " already exists.");
    }

    // encrypt password
    bcrypt.hash(req.body.password, 10, async (err, hash) => {
        if (err) {
            return res.send("Password encryption failed.");
        }
        req.body.password = hash;

        const Employee = require('../models/Employee');
        const newEmployee = createEmployee(Employee, req.body);

        try {
            const savedEmployee = await newEmployee.save();
            updateCaches(); 
            return res.status(200).send("Employee data uploaded successfully.");
        } catch (err) {
            return res.status(500).send(err.message);
        }
    });
});

router.post('/update', verifyToken, verifyManager, async (req, res) => {
    const employeeId = req.body._id;
    console.log(employeeId)
    if (employeeId === undefined) {
        return res.status(400).send('Missing employee id');
    }
    if (typeof (req.body.update) !== "object") {
        return res.status(400).send('Update data is missing or has incorrect format');
    }
    const employeeToUpdate = await findEmployee({ _id: employeeId }, res);
    if (!employeeToUpdate) {
        return res.status(400).send('employee does not exist');
    }
    updateEmployee(employeeToUpdate._id, req.body.update, res);
    updateCaches(); 
    return res.status(200).send("successfully updated employee with id: " + employeeToUpdate._id);
});

router.post('/remove', verifyToken, verifyManager, async (req, res) => {
    const employeeId = req.body._id;
    if (employeeId === undefined) {
        return res.status(400).send('Missing employee id');
    }
    const employeeToRemove = await findEmployee({ _id: employeeId },res);
    if (!employeeToRemove) {
        return res.status(400).send('employee does not exist');
    }
    removeEmployee(employeeToRemove._id, res);
    updateCaches(); 
    return res.status(200).send("successfully removed employee with id: " + employeeToRemove._id);
});


/**
 * search the organization by teams, employees, and other
 * NOTE: query has to be a javascript object
 */
router.get('/query', async (req, res) => {
    try {
        const employee = await findEmployee(req.body.query, res);
        res.json(employee);
    } catch (err) {
        res.status(400).send('query error');
    }
});

/**
 * retrieve the document of the current authenticated user
 */
router.get('/usr', async (req, res) => {
    const token = req.header('auth-token');
    if (!token) {
        return res.status(401).send('Access Denied');
    }
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        const authenticatedUser = await findEmployee({"_id": verified._id},res);
        res.status(200).send(authenticatedUser)
    } catch (err) {
        res.status(400).send('error retrieving currently authenticated user: ' + err.message);
    }
});

/**
Parses uploaded JSON file and imports all employee data to company's collection.
The data POSTed must be of type multipart/form-data and the form field name for the file input
must be "employeeJSON".
*/

router.post('/import', upload.single("employeeJSON"), verifyToken,
    verifyManager, async (req, res) => {
    const Employee = require('../models/Employee');

    fs.readFile(req.file.path, async function (err, data) {
        const employees = JSON.parse(data);

        //delete uploaded file after importing data
        fs.unlinkSync(req.file.path);

        //store individual employees
        for (i in employees) {
          let employee = employees[i];
          if (employee.managerId == undefined) {
            employee.managerId = Number(-1);
          }

          const { error } = validateEmployee(employee);

          if (error) {
              return res.status(400).send(error.details[0].message);
          }

          const credentialsExists = await emailInUse(employee.email, res);

          if (credentialsExists) {
              return res.status(400).send("User: " + employee.email + " already exists.");
          }

          bcrypt.hash(employee.password, 10, async (err, hash) => {
              if (err) {
                  return res.send("Password encryption failed.");
              }
              employee.password = hash;

              const employeeObj = createEmployee(Employee, employee);

              try {
                  const savedEmployee = await employeeObj.save();
              } catch (err) {
                  return res.status(500).send(err.message);
              }
          });
        }
        return res.status(200).send("Employee data uploaded successfully");
    });
});

/**
* Upload an employee image and store it in their document.
* Required body parameters: _id of the employee's document
*/
router.post('/upload-image', upload.single("employeeImg"), verifyToken,
    verifyManager, async (req, res) => {

        const employeeId = req.body._id;
        if (employeeId == undefined) {
            fs.unlinkSync(req.file.path);
            return res.status(400).send("Missing employee ID.");
        }

        const img = {
            buffer: fs.readFileSync(req.file.path),
            contentType: req.file.mimetype
        };

        const employee = await findEmployee({ "_id": employeeId }, res);

        if (!employee) {
            return res.status(400).send("employee with id: " + employeeId + " does not exist.");
        }

        employee.img = img;

        try {
            await employee.save();
            res.status(200).send("Employee image uploaded successfully.");
        } catch (err) {
            res.status(500).send(err.message);
        }

        fs.unlinkSync(req.file.path);

    });

module.exports = router;
