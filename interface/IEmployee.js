
const Employee = require('../models/Employee')("CycloneAviation");

/**
 * Retrieves a user that matches specified properties if they exist. 
 * @param {*} query property of user document 
 */
const findEmployee = async (query) => {
    const employee = await Employee.findOne(query);
    return employee; 
}; 

module.exports.findEmployee = findEmployee;