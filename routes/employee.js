
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

router.get('/:companyName/tree', verifyToken, async (req, res) => {
    try {
        const Employee = require('../models/Employee')(req.params.companyName);
        const employees = await Employee.find();
        const treeData = createTree(sanitizeJSON(employees), Employee); 
        res.json(treeData[0]);
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
router.get('/:companyName/flat', verifyToken, async (req, res) => {
    try {
        //passes in collection name (in this case, the company)
        //TODO: modify collection name to get the company from the currently logged in user
        const Employee = require('../models/Employee')(trimSpaces(req.params.companyName));
        const employees = await Employee.find();
        res.json(employees);
    } catch (err) {
        res.json({
            message: err
        });
    }
});

//need to specify direct reports
/* create a new employee */
router.post('/:companyName/add', verifyToken, verifyManager, async (req, res) => {
    //if manager id is missing, set to -1
    if (req.body.managerId == undefined) {
        req.body.managerId = Number(-1);
    }

    const { error } = validateEmployee(req.body);

    if (error) {
        return res.status(400).send(error.details[0].message);
    }

    const credentialsExists = await emailInUse(req.body.email, trimSpaces(req.user._company), res);

    if (credentialsExists) {
        return res.status(400).send("User: " + req.body.email + " already exists.");
    }

    // encrypt password
    bcrypt.hash(req.body.password, 10, async (err, hash) => {
        if (err) {
            return res.send("Password encryption failed.");
        }
        req.body.password = hash;

        const Employee = require('../models/Employee')(trimSpaces(req.user._company));
        const newEmployee = createEmployee(Employee, req.body);

        try {
            const savedEmployee = await newEmployee.save();
            return res.status(200).send("Employee data uploaded successfully.");
        } catch (err) {
            return res.status(500).send(err.message);
        }
    });
});

router.post('/:companyName/update', verifyToken, verifyManager, async (req, res) => {
    const employeeId = req.body._id;
    if (employeeId === undefined) {
        return res.status(400).send('Missing employee id');
    }
    if (typeof (req.body.update) !== "object") {
        return res.status(400).send('Update data is missing or has incorrect format');
    }
    const employeeToUpdate = await findEmployee({ _id: employeeId },
        trimSpaces(req.params.companyName), res);
    if (!employeeToUpdate) {
        return res.status(400).send('employee does not exist');
    }
    updateEmployee(employeeToUpdate._id, req.body.update, trimSpaces(req.params.companyName), res);
    return res.status(200).send("successfully updated employee with id: " + employeeToRemove._id);
});

/**
* Endpoint to make a employee transfer request (change manager).
*/
router.post('/transfer-request', verifyToken, verifyManager, async (req, res) => {
    const employeeId = req.body._id;
    const newManagerId = req.body.newManagerId;
    if (employeeId === undefined || newManagerId == undefined) {
        return res.status(400).send('Missing employee id');
    }

    const employeeToTransfer = await findEmployee({ _id: employeeId }, res);
    const newManager = await findEmployee({ _id: newManagerId }, res);

    //make sure employee and new manager are valid
    if (!employeeToTransfer) {
        return res.status(400).send('Employee does not exist.');
    }

    if(!newManager) {
      return res.status(400).send('Manager does not exist.');
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
    const requestId = req.body._id;
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

        if (!employeeToTransfer || !newManager) {
          return res.status(400).send("Employee does not exist.");
        }

        //reassign direct reports to employee's old manager
        await reassignDirectReports(employeeToTransfer.employeeId, employeeToTransfer.managerId, res);

        //assign new manager
        await updateEmployee(employeeToTransfer._id, {"managerId": newManager.employeeId}, res);

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

//TODO: when deleting an employee, we need to remove any transfer requests involving them
router.post('/:companyName/remove', verifyToken, verifyManager, async (req, res) => {
    const employeeId = req.body._id;
    if (employeeId === undefined) {
        return res.status(400).send('Missing employee id');
    }
    const employeeToRemove = await findEmployee({ _id: employeeId },
        trimSpaces(req.params.companyName), res);
    if (!employeeToRemove) {
        return res.status(400).send('employee does not exist');
    }
    removeEmployee(employeeToRemove._id, trimSpaces(req.params.companyName), res);
    return res.status(200).send("successfully removed employee with id: " + employeeToRemove._id);
});

/**
* Endpoint to get all transfer requests that need to be approved by given employee.
*/
router.get('/transfer-requests', verifyToken, verifyManager, async (req, res) => {
    //id of manager we need approval from
    const employeeId = req.body._id;

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
router.get('/:companyName/query', async (req, res) => {
    try {
        const employee = await findEmployee(req.body.query, trimSpaces(req.params.companyName), res);
        res.json(employee);
    } catch (err) {
        res.status(400).send('query error');
    }
});

/**
 * retrieve the document of the current authenticated user
 */
router.get('/:companyName/usr', async (req, res) => {
    const token = req.header('auth-token');
    if (!token) {
        return res.status(401).send('Access Denied');
    }
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        const authenticatedUser = await findEmployee({"_id": verified._id}, req.params.companyName, res); 
        res.status(200).send(authenticatedUser)
    } catch (err) {
        res.status(400).send('error retrieving currently authenticated user: ' + err.message); 
    }
});

/**
Parses uploaded JSON file and imports all employee data to company's collection.
The data POSTed must be of type multipart/form-data and the form field name for the file input
must be "employeeJSON". A "company" field is also required with the name of the company the data belongs to.
*/

router.post('/import', upload.single("employeeJSON"), verifyToken, verifyManager, async (req, res) => {
    //if the company name is missing
    if (req.body.company == undefined) {
        fs.unlinkSync(req.file.path);
        return res.status(400).send("Missing company name.");
    }

    const company = req.body.company.replace(/\s/g, '');

    //passes in collection name (in this case, the company)
    const Employee = require('../models/Employee')(company);

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

          const credentialsExists = await emailInUse(employee.email, company, res);

          if (credentialsExists) {
              return res.status(400).send("User: " + employee.email + " already exists.");
          }

          bcrypt.hash(employee.password, 10, async (err, hash) => {
              if (err) {
                  return res.send("Password encryption failed.");
              }
              employee.password = hash;

              const employeeObj = createEmployee(Employee, employee);

              //to make sure flat and tree collections have the same id
              employeeObj._id = idMap[employee.employeeId]._id;

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
router.post('/:companyName/upload-image', upload.single("employeeImg"), verifyToken,
    verifyManager, async (req, res) => {
        //if the company name is missing
        if (req.body.employeeId == undefined) {
            fs.unlinkSync(req.file.path);
            return res.status(400).send("Missing employee ID.");
        }

        const img = {
            data: fs.readFileSync(req.file.path),
            contentType: req.file.mimetype
        };

        const employee = await findEmployee({ "_id": req.body.employeeId }, trimSpaces(req.params.companyName), res);

        if (!employee) {
            return res.status(400).send("employee with id: " + req.body.employeeId + " does not exist.");
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
