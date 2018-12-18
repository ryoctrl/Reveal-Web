'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
      return [
          queryInterface.addColumn('users', 'activate_hash', {
              type: Sequelize.STRING,
              defaultValue: 'None',
              allowNull: false
          }),
          queryInterface.addColumn('users', 'activated', {
              type: Sequelize.BOOLEAN,
              defaultValue: false,
              allowNull: false
          })
      ];
  },

  down: (queryInterface, Sequelize) => {
      return [
          queryInterface.removeColumn('users', 'activate_hash'),
          queryInterface.removeColumn('users', 'activated'),
      ];
  }
};
