
const createTree = (employees) => {
    let hashTable = Object.create(null);
    employees.forEach(employeeData => hashTable[employeeData.employeeId] = { ...employeeData, children: [] });
    let employeeTree = [];
    employees.forEach(employeeData => {
        if (employeeData.managerId) {
            hashTable[employeeData.managerId].children.push(hashTable[employeeData.employeeId]);
        } else {
            employeeTree.push(hashTable[employeeData.employeeId]);
        }
    });
    return employeeTree;
}

module.exports.createTree = createTree; 