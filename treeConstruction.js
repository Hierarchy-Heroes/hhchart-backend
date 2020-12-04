const sanitizeJSON = (clusterData) => {
    cleanData = [];
    clusterData.forEach(documentData => {
        cleanData.push(documentData._doc);
    });
    return cleanData;
}

/**
* Checks whether or not the graph created by the input data forms a valid tree.
*/
const checkValidTree = async (employees, res) => {

  try {
    //get all the employees currently stored in the database
    const Employee = require('./models/Employee');
    const storedEmployees = await Employee.find();
    const combinedEmployees = storedEmployees.concat(employees);
    const tree = createTree(storedEmployees);
    if(tree === undefined) {
      return res.status(400).send("Unable to form tree: manager does not exist.");
    }
    //the graph is one big cycle
    if(tree.length == 0) {
      return res.status(400).send("Malformed input data: Cycle detected (missing CEO)");
    }

    //dangling employee
    if (tree.length > 1) {
      return res.status(400).send("Malformed input data: There is more than one employee without a manager.")
    }
  } catch (err) {
    return res.status(400).send("Unable to form tree.");
  }
}

/**
* Generate's a tree structure of employees.
* @param {[Object]} employees
* @return {[Object]} -- a tree structure containing Employee objects
*/
const createTree = (employees) => {
    let hashTable = Object.create(null);
    employees.forEach((employeeData) => {
      //no need to store the password in the tree
      let employeeCopy = { ...employeeData, children: [] };
      delete employeeCopy.password;

      hashTable[employeeData.employeeId] = employeeCopy;
    });
    let employeeTree = [];
    employees.forEach(employeeData => {
        if (employeeData.managerId !== undefined && employeeData.managerId >= 0) {
          hashTable[employeeData.managerId].children.push(hashTable[employeeData.employeeId]);
        } else {
            employeeTree.push(hashTable[employeeData.employeeId]);
        }
    });
    return employeeTree;
}


module.exports.createTree = createTree;
module.exports.sanitizeJSON = sanitizeJSON;
module.exports.checkValidTree = checkValidTree;
