
const Joi = require('@hapi/joi');
const bcrypt = require('bcryptjs');
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
        .min(4)
        .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$'))
        .required(),

    positionTitle: Joi.string(),

    companyName: Joi.string(),

    isManager: Joi.boolean(),

    employeeId: Joi.number()
        .required(),

    managerId: Joi.number()
        .required(),

    email: Joi.string()
        .email()
        .required(),

    startDate: Joi.string(),
});

const validLoginCredentials = Joi.object({
    email: Joi.string()
        .email()
        .required(),

    password: Joi.string()
        .min(4)
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
        const user = await findEmployee({ email: emailValue }, res);
        return user;
    } catch (err) {
        return res.status(400).send(err.message);
    }
};

/**
 * cross-references requested credentials with those stored in the database
 * @param {*} userPassword password associated with the currently selected user, stored in db
 * @param {*} value password included in HTTP payload
 */
const matchPassword = async (value, userPassword, res) => {
    bcrypt.compare(value, userPassword, (err, result) => {
        if (err) {
            res.status(400).send(err.message);
        }
        return result;
    })
};

module.exports = {
    validateEmployee: validateEmployee,
    validateLogin: validateLogin,
    emailInUse: emailInUse,
    matchPassword: matchPassword
}
