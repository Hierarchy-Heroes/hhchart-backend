
const express = require('express');
const router = express.Router();
const multer = require('multer');
const bcrypt = require('bcryptjs');
const fs = require("fs")
const jwt = require('jsonwebtoken');
const { verifyToken, verifyManager } = require('../verification');
const { validateEmployee, emailInUse } = require('../validation');
const { createTree, sanitizeJSON } = require('../treeConstruction');
const { findEmployee, updateEmployee, removeEmployee, createEmployee, reassignDirectReports } = require('../interface/IEmployee');
const { trimSpaces } = require('../misc/helper');

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

const upload = multer({ storage: storage });

router.get('/tree', verifyToken, async (req, res) => {
    try {
        const Employee = require('../models/Employee');
        const employees = await Employee.find();
        const treeData = createTree(sanitizeJSON(employees), Employee);
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
        const employees = await Employee.find();
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
            return res.status(200).send("Employee data uploaded successfully.");
        } catch (err) {
            return res.status(500).send(err.message);
        }
    });
});

router.post('/update', verifyToken, verifyManager, async (req, res) => {
  //TODO: check if the manager is actually the manager of employee
    const employeeId = req.body._id;
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
    return res.status(200).send("successfully updated employee with id: " + employeeToUpdate._id);
});

/**
* Endpoint to make a employee transfer request (change manager).
*/
router.post('/transfer-request', verifyToken, verifyManager, async (req, res) => {
    //the person making the request is the new manager (currently logged in)
    const newManagerId = req.user._id;
    const employeeId = req.body.employeeId;

    if (employeeId === undefined || newManagerId == undefined) {
        return res.status(400).send('Missing employee id.');
    }

    const employeeToTransfer = await findEmployee({ _id: employeeId }, res);
    const newManager = await findEmployee({ _id: newManagerId }, res);

    //make sure employee is valid
    if (!employeeToTransfer) {
        return res.status(400).send('Employee does not exist.');
    //make sure the new manager is different from current manager
    } else if (employeeToTransfer.managerId === newManager.employeeId) {
        return res.status(400).send('Employee is already under manager: ' + newManagerId);
    }

    const Request = require('../models/Request');

    const newRequest = new Request({
            employeeId: employeeId,
            newManagerId: newManagerId,
    });

    try {
        const savedRequest = await newRequest.save();
        return res.status(200).send("Request created successfully");
    } catch (err) {
        return res.status(500).send(err.message);
    }
});

/**
* Endpoint to approve or deny an employee transfer.
*/
router.post('/transfer', verifyToken, verifyManager, async (req, res) => {
  //TODO: check if manager approving/denying is actually the manager of the employee
    const requestId = req.body.requestId;
    const approved = req.body.approved;
    const Request = require('../models/Request');

    if (approved) {
      try {
        const request = await Request.findOne({"_id": requestId});

        if (!request) {
          return res.status(400).send("Request does not exist.");
        }

        const employeeToTransfer = await findEmployee({ _id: request.employeeId }, res);
        const newManager = await findEmployee({ _id: request.newManagerId }, res);

        //make sure employee and new manager exist
        if (!employeeToTransfer || !newManager) {
          return res.status(400).send("Employee does not exist.");
        }

        //reassign direct reports to employee's old manager
        await reassignDirectReports(employeeToTransfer.employeeId, employeeToTransfer.managerId, res);

        //assign new manager
        await updateEmployee(employeeToTransfer._id, {"managerId": newManager.employeeId}, res);

        //remove request because we are done with it now
        Request.findByIdAndRemove(requestId, (err) => {
            if (err) {
                return res.status(400).send("Removing request error: " + err.message);
            }
        });

        return res.status(200).send("Employee transfer complete.")

      } catch (err) {
        return res.status(500).send(err.message);
      }
    } else {
        //delete request
        Request.findByIdAndRemove(requestId, (err) => {
            if (err) {
                return res.status(400).send("Removing request error: " + err.message);
            }
            return res.status(200).send("Request denied successfully.");
        });
    }

});

router.post('/remove', verifyToken, verifyManager, async (req, res) => {
  //TODO: check if the manager is actually the manager of employee
    const employeeId = req.body._id;
    if (employeeId === undefined) {
        return res.status(400).send('Missing employee id');
    }
    const employeeToRemove = await findEmployee({ _id: employeeId },res);
    if (!employeeToRemove) {
        return res.status(400).send('employee does not exist');
    }

    //reassign direct reports to employee's manager
    await reassignDirectReports(employeeToRemove.employeeId, employeeToRemove.managerId, res);

    await removeEmployee(employeeToRemove._id, res);

    //remove existing requests involving employee
    const Request = require('../models/Request');
    Request.remove({$or: [{"employeeId": employeeId}, {"newManagerId": employeeId}]}, (err) => {
      if (err) {
          return res.status(400).send("Removing request error: " + err.message);
      }
    });

    return res.status(200).send("successfully removed employee with id: " + employeeToRemove._id);
});

/**
* Endpoint to get all transfer requests that need to be approved by logged in employee.
*/
router.get('/transfer-requests', verifyToken, verifyManager, async (req, res) => {
    //id of manager we need approval from (logged in user)
    const employeeId = req.user._id;

    try {
      const Request = require('../models/Request');
      let reqs = await Request.find({"newManagerId": employeeId});
      return res.json(reqs);
    } catch (err) {
        return res.status(500).send(err.message);
    }

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
