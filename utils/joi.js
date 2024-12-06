import Joi from 'joi';

export const validateUser = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('admin', 'user').required(),
  });
  return schema.validate(data);
};
export const validateTask = (data) => {
    const schema = Joi.object({
      title: Joi.string().min(3).required(), 
      status: Joi.string()
        .valid('inprogress', 'completed', 'notstarted')
        .required(), 
      assignedTo: Joi.string().required(), 
    });
    return schema.validate(data);
  };