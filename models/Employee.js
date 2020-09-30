
const mongoose = require('mongoose');
const helpers = require('../helper'); 

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
    isManager: Boolean, 
    employeeId: Number, 
    email: {
        type: String, 
        required: true, 
    }, 
    startDate: {
        type: String, 
        default: helpers.formatDate(new Date()), 
    }
});

module.exports = mongoose.model('Employee', EmployeeSchema); 