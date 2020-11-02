
const mongoose = require('mongoose');

const RequestSchema = mongoose.Schema({
    employeeId: {
      type: String,
      required: true
    },
    currentManagerId: {
      type: String,
      required: true
    },
    newManagerId: {
      type: String,
      required: true
    }
});

module.exports = return mongoose.model('Request', RequestSchema, 'requests');
