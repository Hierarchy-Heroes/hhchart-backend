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
const checkValidTree = (employees) => {

  try {
    const tree = createTree(employees);
    //the graph is one big cycle
    if(tree.length == 0) {
      return {error: true, message: "Malformed input data: Cycle detected (missing CEO)"};
    }

    //dangling employee
    if (tree.length > 1) {
      return {error: true, message: "Malformed input data: There is more than one employee without a manager."};
    }

    return {error: false};
  } catch (err) {
    return {error: true, message: "Unable to form tree."};
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
