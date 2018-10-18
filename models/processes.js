'use strict';
module.exports = (sequelize, DataTypes) => {
  const processes = sequelize.define('processes', {
    user_id: DataTypes.INTEGER,
    port: DataTypes.INTEGER
  }, {
    underscored: true,
  });
  processes.associate = function(models) {
      processes.belongsTo(models.users, {"foreignKey": "user_id"});
  };
  return processes;
};
