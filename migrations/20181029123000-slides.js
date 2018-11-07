'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
      return [
          queryInterface.addColumn('slides', 'design', {
              type: Sequelize.STRING,
              allowNull: false,
              defaultValue: 'black'
          })
      ];
  },

  down: (queryInterface, Sequelize) => {
      return [
          queryInterface.removeColumn('slides', 'design')
      ];
  }
};
