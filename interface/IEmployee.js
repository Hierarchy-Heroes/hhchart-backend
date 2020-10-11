
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

module.exports.findEmployee = findEmployee;