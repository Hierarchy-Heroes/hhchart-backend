
const Joi = require('@hapi/joi');

const validEmployeeSchema = Joi.object({
    firstName: Joi.string()
        .alphanum()
        .min(1)
        .required(),

    lastName: Joi.string()
        .min(1)
        .required(),

    companyId: Joi.number()
        .required(),

    password: Joi.string()
        .min(8)
        .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$'))
        .required(),

    positionTitle: Joi.string(),

    companyName: Joi.string(),

    isManager: Joi.boolean(),

    employeeId: Joi.number(),

    email: Joi.string()
        .required(),

    startDate: Joi.string(),
});

const validateEmployee = (value) => {
    return validEmployeeSchema.validate(value);
};

module.exports.validateEmployee = validateEmployee;