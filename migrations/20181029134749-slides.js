'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
      return [
          queryInterface.addColumn('slides', 'motion', {
              type: Sequelize.STRING,
              allowNull: false,
              defaultValue: 'default'
          })
      ];
  },

  down: (queryInterface, Sequelize) => {
      return [
          queryInterface.removeColumn('slides', 'motion')
      ];
  }
};
