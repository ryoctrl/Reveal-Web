const execSync = require('child_process').execSync;
const exec = require('child_process').exec;
const defaultPort = 9500;
const models = require('../models');

module.exports.reveal = {
    runAsNewProcess: function(path, cb) {
        models.processes.max('port').then(max=> {
            max = Number.isNaN(max) ? defaultPort : max;
            let newPort = max + 1;
            let cmd = "revealgo";
            cmd += ` -p ${newPort}`;
            cmd += ` ${path}`;
            exec(cmd, (err, stdout, stderr) => {
                if(err) console.log(err);
            });
            models.slides.findOne({
                where: {
                    markdown_path: path
                }
            }).then((record) => {
                const processObj = {
                    user_id: record.user_id,
                    port: newPort
                };
                models.processes.create(processObj);
                cb();
            });
        }).catch((err) => {
            //TODO: エラーを追跡
        });
    },
    runIfNeeded: function(path, port) {
        let cmd = "revealgo";
        cmd += ` -p ${port}`;
        cmd += ` ${path}`;
        exec(cmd, (err, stdout, stderr) => {
            if(err) console.log(err);
        });
    },
    checkPort: function(port) {
        return true;
    }

}
