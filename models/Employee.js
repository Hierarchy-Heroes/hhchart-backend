
const mongoose = require('mongoose');
const helpers = require('../misc/helper');

// idea: hold some defaults for the company so we
// can set default for email as first char of fname and lastname
//  @company domain
const EmployeeSchema = mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    companyId: Number,
    password: String,
    positionTitle: String,
    companyName: String,
    isManager: {
        type: Boolean,
        default: false
    },
    employeeId: Number,
    managerId: {
        type: Number,
        required: true
    },
    email: {
        type: String,
        required: true,
    },
    startDate: {
        type: String,
        default: helpers.formatDate(new Date()),
    },
    img: {
        buffer: Buffer,
        contentType: String
    },
    teamId: String,
    children: []
});

module.exports = mongoose.model('Employee', EmployeeSchema, "employees");
