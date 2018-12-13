'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
      return [
          queryInterface.addColumn('users', 'provider', {
              type: Sequelize.STRING,
              allowNull: false,
              defaultValue: 'original'
          })
      ];
  },

  down: (queryInterface, Sequelize) => {
      return [
          queryInterface.removeColumn('users', 'provider')
      ];
  }
};
