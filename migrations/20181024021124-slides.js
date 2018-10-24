'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
      return [
          queryInterface.addColumn('slides', 'shared', {
              type: Sequelize.BOOLEAN,
              allowNull: false,
              defaultValue: false,
          })
      ];
  },

  down: (queryInterface, Sequelize) => {
      return [
          queryInterface.removeColumn('slides', 'shred'),
      ];
  }
};
