'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
      return [
          queryInterface.addColumn('resources', 'name', {
              type: Sequelize.STRING,
              allowNull: false,
              defaultValue: 'NoName',
            })
      ];
  },

  down: (queryInterface, Sequelize) => {
      return [
          queryInterface.removeColumn('resources', 'name')
      ];
  }
};
