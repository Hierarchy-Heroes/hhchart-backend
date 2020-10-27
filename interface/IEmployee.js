
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

module.exports = {
    findEmployee: findEmployee,
    removeEmployee: removeEmployee,
    updateEmployee: updateEmployee
}; 