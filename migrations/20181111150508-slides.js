'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
      return [
          queryInterface.addColumn('slides', 'css', {
              type: Sequelize.STRING,
          })
      ];
  },
  down: (queryInterface, Sequelize) => {
      return [
          queryInterface.removeColumn('slides', 'css')
      ];
  }
};
