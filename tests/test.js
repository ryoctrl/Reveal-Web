const reveal = require('../controllers/revealgo.js').reveal;
const models = require('../models');

const proc = async () => {
    const query = {
        where: {
            user_id: 1
        }
    };

    let process = await models.processes.findOne(query);

    console.log(typeof process.getDataValue('port'));
    console.log(typeof process.port);

    let canUse = await reveal.checkPort(process.port);
    console.log(canUse);


};


proc();
