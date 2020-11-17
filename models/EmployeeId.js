
const mongoose = require('mongoose');
const helpers = require('../misc/helper');

// idea: hold some defaults for the company so we
// can set default for email as first char of fname and lastname
//  @company domain
const EmployeeIdSchema = mongoose.Schema({
    employeeId: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('EmployeeId', EmployeeIdSchema, "employeeId");