
const sanitizeJSON = (clusterData) => {
    cleanData = []; 
    clusterData.forEach(documentData => {
        cleanData.push(documentData._doc); 
    });
    return cleanData;
}

const createTree = (employees, Employee) => {
    let hashTable = Object.create(null);
    employees.forEach((employeeData) => {
      //no need to store the password in the tree
      let employeeCopy = { ...employeeData, children: [] };
      delete employeeCopy.password;

      hashTable[employeeData.employeeId] = createEmployee(Employee, employeeCopy);
    });
    let employeeTree = [];
    employees.forEach(employeeData => {
        if (employeeData.managerId || employeeData.managerId >= 0) {
            hashTable[employeeData.managerId].children.push(hashTable[employeeData.employeeId]);
        } else {
            employeeTree.push(hashTable[employeeData.employeeId]);
        }
    });
    return employeeTree;
}

/**
* TODO: Place this in helper.js?
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

module.exports.createTree = createTree;
module.exports.sanitizeJSON = sanitizeJSON;
