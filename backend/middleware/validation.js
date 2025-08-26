const Joi = require('joi');

const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    companyName: Joi.string().required(),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        let dataToValidate;
        switch (source) {
            case 'body':
                dataToValidate = req.body;
                break;
            case 'params':
                dataToValidate = req.params;
                break;
            case 'query':
                dataToValidate = req.query;
                break;
            default:
                return res.status(500).json({ error: 'Invalid validation source' });
        }

        const { error } = schema.validate(dataToValidate);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        next();
    };
};

const createCheckSchema = Joi.object({
    fullName: Joi.string().required(),
    email: Joi.string().email().required(),
});

const validateCheckSchema = Joi.object({
    token: Joi.string().hex().length(64).required(),
});

const getReportSchema = Joi.object({
    applicantId: Joi.number().integer().required(),
});

const handleTinkCallbackSchema = Joi.object({
    code: Joi.string().required(),
    state: Joi.string().hex().length(64).required(),
});

const createCheckoutSessionSchema = Joi.object({
    priceId: Joi.string().required(),
});

module.exports = {
    validate,
    registerSchema,
    loginSchema,
    createCheckSchema,
    validateCheckSchema,
    getReportSchema,
    handleTinkCallbackSchema,
    createCheckoutSessionSchema,
};
