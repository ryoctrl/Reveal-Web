const execSync = require('child_process').execSync;
const exec = require('child_process').exec;
const util = require('util');
const exe = util.promisify(require('child_process').exec);
const defaultPort = 9500;
const models = require('../models');

module.exports.reveal = {
    runAsNewProcess: async function(slide, cb) {
        let max = await models.processes.max('port');
        max = Number.isNaN(max) ? defaultPort : max;
        while(true) {
            max++;
            if(await this.checkPort(max)) break;
        }
        
        let cmd = this.generateExecCommand(slide, {port: max});
        let {err, stdout, stderr} = await exec(cmd);
        if(err) {
            console.error('an error occured where controllers/revealgo.js/runIfNeeded');
            console.error(cmd);
            console.error(err);
            return;
        }



        const processObj = {
            user_id: slide.user_id || slide.getDataValue('user_id'),
            port: max
        };
        await models.processes.create(processObj);

        cb();
        return;
    },
    runIfNeeded: async function(slide, process) {
        let idlePort = await this.checkPort(process.port || process.getDataValue('port'));

        if(!idlePort) return;

        const cmd = this.generateExecCommand(slide, process);

        exec(cmd, (err, stdout, stderr) => {
            if(err) {
                console.error('an error occured where controllers/revealgo.js/runIfNeeded');
                console.error(cmd);
                console.error(err);
            }

            if(stderr) {
                console.error('an error occured where controllers/revealgo.js/runIfNeeded');
                console.error(cmd);
                console.error('stderr');
            }
        });
    },
    checkPort: async function(port) {
        if(!port) return false;
        if(!typeof port === 'number') return false;

        const shcmd = `if lsof -i:${port} > /dev/null; then echo false; else echo true;fi`
        let {stdout, stderr} = await exe(shcmd, {shell: true});
        stdout = stdout.length > 4 ? stdout.substr(0, 4) : stdout;
        return stdout === 'true';
    },
    rebootReveal: async function(slide, process) {
        let port = process.port || process.getDataValue('port');
        if(!port) return;
        await this.killProcess(port);
        
        let cmd = this.generateExecCommand(slide, process);
        if(!cmd) return;
        exec(cmd, (err, stdout, stderr) => {
            if(err) console.log(err);
        });
    },
    generateExecCommand: function(slide, process) {
        let design = slide.design || slide.getDataValue('design');
        let motion = slide.motion || slide.getDataValue('motion');
        let path = slide.markdown_path || slide.getDataValue('markdown_path');
        let port = process.port || process.getDataValue('port');
        if(!design || !motion || !path || !port) return false;

        let cmd = "revealgo";
        cmd += ` -p ${port}`;
        cmd += ` --theme ${design}`;
        cmd += ` --transition ${motion}`;
        cmd += ` ${path}`;
        return cmd;
    },
    killProcess: async function(port) {
        const {stdout, stderr} = await exe(`lsof -i:${port}`, {shell: true}).catch((err) => {
            return;
        });

        if(!stdout) return;

        let lines = stdout.split('\n');

        if(lines.length < 2) return;
        let pid = lines[1].split(' ')[1];
        exec(`kill ${pid}`, (err, stdout, stderr) => {
            console.log('killed');
        });
    }
}
