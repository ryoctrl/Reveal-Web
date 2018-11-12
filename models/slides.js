'use strict';
module.exports = (sequelize, DataTypes) => {
  const slides = sequelize.define('slides', {
    user_id: DataTypes.INTEGER,
    markdown_path: DataTypes.STRING,
    shared: DataTypes.BOOLEAN,
    design: DataTypes.STRING,
    motion: DataTypes.STRING,
    css: DataTypes.STRING,
  }, {
    underscored: true,
  });
  slides.associate = function(models) {
      slides.belongsTo(models.users, {"foreignKey": "user_id"});
  };
  return slides;
};
