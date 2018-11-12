'use strict';
module.exports = (sequelize, DataTypes) => {
  const resources = sequelize.define('resources', {
    user_id: DataTypes.INTEGER,
    path: DataTypes.STRING,
    name: DataTypes.STRING
  }, {});
  resources.associate = function(models) {
      resources.belongsTo(models.users, {"foreignKey": "user_id"});
  };
  return resources;
};
