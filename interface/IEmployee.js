
/**
 * Retrieves a user that matches specified properties if they exist.
 * @param {*} query property of user document
 * @param {*} collectionName specifies which collection to parse in search of this employee
 */

const findEmployee = async (query, collectionName, res) => {
    const Employee = require('../models/Employee')(collectionName);
    return Employee.findOne(query, (err) => {
        if (err) {
            return res.status(400).send("Finding employee error: " + err.message);
        }
    });
};

const removeEmployee = async (id, collectionName, res) => {
    const Employee = require('../models/Employee')(collectionName);
    Employee.findByIdAndRemove(id, (err) => {
        if (err) {
            return res.status(400).send("Removing employee error: " + err.message);
        }
    });
}

const updateEmployee = async (id, update, collectionName, res) => {
    const Employee = require('../models/Employee')(collectionName);
    Employee.findByIdAndUpdate(id, { $set: update }, (err) => {
        if (err) {
            return res.status(400).send("Updating employee error: " + err.message);
        }
    });
}

const reassignDirectReports = async (employeeId, managerId, res) => {
  const Employee = require('../models/Employee');
  try {
    //get the direct reports of the employee
    const directReportsQuery = Employee.find({"managerId": employeeId});

    directReportsQuery.exec((err, directReports) => {
      if(err) {
        return res.status(400).send("Reassigning direct reports error: " + err.message);
      }

      directReports.forEach(async (employeeData) => {
          //change manager of each direct report
          await updateEmployee(employeeData._id, {"managerId": managerId}, res);
      });

    });

  } catch (err) {
    return res.status(500).send(err.message);
  }
}

/**
* Creates a new Employee schema object with the passed in employee data.
* @param {Schema} Employee
* @param {Object} employeeData
* @return {Schema}
*/
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
        managerId: employeeData.managerId,
        email: employeeData.email,
        startDate: employeeData.startDate,
    });
    return employeeObj;
}

module.exports = {
    findEmployee: findEmployee,
    removeEmployee: removeEmployee,
    updateEmployee: updateEmployee,
    reassignDirectReports: reassignDirectReports,
    createEmployee: createEmployee
};
