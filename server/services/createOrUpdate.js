import { Model } from 'sequelize';

Model.createOrUpdate = async function (
  options = {
    defaults: {},
    where: {},
  },
) {
  // Normalize inputs
  const { defaults = {}, where = {}, ...rest } = options || {};

  // findOrCreate returns [instance, created]
  const [instance, created] = await this.findOrCreate({ where, defaults, ...rest });

  // If a new instance was created, return it
  if (created) return instance;

  // Otherwise update the existing instance with provided defaults (fields to set)
  // Use the same options (transaction, etc.) passed in rest where applicable
  await instance.update(defaults, { ...rest });

  // Reload to ensure all associations/fields are fresh
  return instance.reload();
};
