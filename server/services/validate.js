import Validator from 'validatorjs';
import HttpError from 'http-errors';

function validate(input, rules, customMessages) {
  const validation = new Validator(input, rules, customMessages);
  if (validation.fails()) {
    // for (const i in validation.errors.errors) {
    //   validation.errors.errors[i] = validation.errors.errors[i][0];
    // }
    return {
      ...validation,
      throw: (code = 422) => {
        throw HttpError(code, validation.errors);
      },
    };
  }

  return {
    ...validation,
    throw: () => validation,
  };
}

export default validate;