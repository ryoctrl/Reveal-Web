const execSync = require('child_process').execSync;
const exec = require('child_process').exec;
const util = require('util');
const exe = util.promisify(require('child_process').exec);
const defaultPort = 9500;
const models = require('../models');

module.exports.reveal = {
    runAsNewProcess: async function(path, cb) {
        let max = await models.processes.max('port');
        max = Number.isNaN(max) ? defaultPort : max;
        let newPort = max + 1;
        let cmd = 'revealgo';
        cmd += ` -p ${newPort}`;
        cmd += ` ${path}`;


        const callback = async (err) => {
            console.log('プロセス起動コールバックが呼ばれました');
            exec(cmd, (err, stdout, stderr) => {
                if(err) console.log(err);
            });

            let query = {
                where: {
                    markdown_path: path
                }
            };

            let slide = await models.slides.findOne(query);
            const processObj = {
                user_id: slide.getDataValue('user_id'),
                port: newPort
            };
            await models.processes.create(processObj);
            cb();
            return;
        }

        //lsofコマンドの特性上、そのポートをしているアプリケーションがない場合にexitCode1を返すため、catchされることとなる。
        //なのでcatch内に本来行うべきを記述しなければならない
        do {
            console.log(`${newPort} での起動を試みます`);
            const {stdout, stderr} = await exe(`lsof -i:${newPort}`, { shell: true }).catch(callback);
            newPort++;
        }while(!stdout && !stderr);
    },
    runIfNeeded: async function(path, port) {
        const {stdout, stderr} = await exe(`lsof -i:${port}`, {shell: true}).catch((err) => {
            let cmd = "revealgo";
            cmd += ` -p ${port}`;
            cmd += ` ${path}`;
            exec(cmd, (err, stdout, stderr) => {
                if(err) console.log(err);
            });
        });
    },
    checkPort: function(port) {
        return true;
    }

}
