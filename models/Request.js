const mongoose = require('mongoose');

const RequestSchema = mongoose.Schema({
    employeeId: {
      type: String,
      required: true
    },
    newManagerId: {
      type: String,
      required: true
    },
    transferType: {
      type: String,
      default: 'individual',
      enum: ['individual', 'team']
    }
});

module.exports = mongoose.model('Request', RequestSchema, 'requests');
