
const Joi = require('@hapi/joi');
const { findEmployee } = require('./interface/IEmployee');

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

const validLoginCredentials = Joi.object({
    email: Joi.string()
        .required(),

    password: Joi.string()
        .min(8)
        .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$'))
        .required(), 
});

/**
 * verifies that all necessary properties are supplied before employee creation 
 * @param {*} value 
 */
const validateEmployee = (value) => {
    return validEmployeeSchema.validate(value);
};

/**
 * verifies that all necessary properties are supplied and correct before attempting login 
 * @param {*} value 
 */
const validateLogin = (value) => {
    return validLoginCredentials.validate(value);
}

/**
 * verifies if the database contains a user associated with supplied email 
 * @param {*} email
 * @param {*} result print to result in case of error 
 */
const emailInUse = async (emailValue, res) => {
    try {
        const user = await findEmployee({email: emailValue}); 
        return user; 
    } catch (err) {
        res.send(err);
    }
};

/**
 * cross-references requested credentials with those stored in the database 
 * @param {*} userPassword password associated with the currently selected user 
 * @param {*} value password included in HTTP payload 
 */
const matchPassword = (userPassword, value) => {
    // TODO: change this to encrypted library implementation
    return userPassword === value; 
};

module.exports = {
    validateEmployee: validateEmployee, 
    validateLogin: validateLogin, 
    emailInUse: emailInUse,
    matchPassword: matchPassword
}