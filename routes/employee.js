const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require("fs");


//Multer storage
//Reference: https://code.tutsplus.com/tutorials/file-upload-with-multer-in-node--cms-32088
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "uploads");
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now());
  }
});

const upload = multer({storage: storage})

router.get('/:companyName', async (req, res) => {
    try {
        //passes in collection name (in this case, the company)
        //TODO: modify collection name to get the company from the currently logged in user
        const Employee = require('../models/Employee')(req.params.companyName);
        const employees = await Employee.find();
        res.json(employees);
    } catch (err) {
        res.json({ message : err });
    }
});

router.get('/employee/:employeeId', (req, res) => {
    res.send("We are looking at employee 1");
});

/**
Parses uploaded JSON file and imports all employee data to company's collection.
*/
router.post('/import', upload.single("upload"), async(req, res) => {
  //passes in collection name (in this case, the company)
  //TODO: modify collection name to get the company from form input
  // const Employee = require('../models/Employee')(req.body.companyName.replace(/\s/g,''));

  //hardcoded collection for now
  const Employee = require('../models/Employee')("CycloneAviation");

  let response = "Employees uploaded successfully."
  fs.readFile(req.file.path, async function(err, data) {
    const str = String.fromCharCode.apply(String, data);
    const employees = JSON.parse(data);

    for(i in employees) {
      const employeeObj = createEmployee(Employee, employees[i]);

      try {
          const savedEmployee = await employeeObj.save();
      } catch (err) {
          response = err.message;      }
    }

  });

  //send a response back
  res.json({"message": response});

  //delete uploaded file after importing data
  fs.unlinkSync(req.file.path);

});

/* create a new employee */
router.post('/', async (req, res) => {
    const Employee = require('../models/Employee')(req.body.companyName.replace(/\s/g,''));
    const newEmployee = createEmployee(Employee, req.body);
    try {
        const savedEmployee = await newEmployee.save();
        res.json(savedEmployee);
    } catch (err) {
        res.json({ message : err });
    }
});

function createEmployee(Employee, employeeData) {
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
