
/**
 * Retrieves a user that matches specified properties if they exist.
 * @param {*} query property of user document
 * @param {*} collectionName specifies which collection to parse in search of this employee
 */
const findEmployee = async (query, collectionName) => {
    const Employee = require('../models/Employee')(collectionName),
          found = await Employee.findOne(query);
    return found;
};

/**
* Creates a new Employee schema object with the passed in employee data.
* @param {Schema} Employee
* @param {Object} employeeData
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

module.exports.findEmployee = findEmployee;
module.exports.createEmployee = createEmployee;
