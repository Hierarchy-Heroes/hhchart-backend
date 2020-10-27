const { createEmployee } = require('./interface/IEmployee');

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


module.exports.createTree = createTree;
module.exports.sanitizeJSON = sanitizeJSON;
