const fs = require('fs');
const util = require('util');
const spawn = require('child_process').spawn;
const exe = util.promisify(require('child_process').exec);
const models = require('../models');

module.exports.reveal = {
    executeRevealProcess: async function(options) {
        if(!options) return false;
        try {
            spawn('revealgo', options);
        } catch(e) {
            console.error('an error has occured where executing revealgo command');
            console.error(e.toString());
            return false;
        }
        return true;
    },
    runAsNewProcess: async function(slide, cb) {
        let defaultPort = process.env.PORT;
        let max = await models.processes.max('port');
        max = Number.isNaN(max) ? defaultPort : max;
        while(true) {
            max++;
            if(await this.checkPort(max)) break;
        }
        
        let cmd = this.generateExecCommand(slide, {port: max});
        let success = this.executeRevealProcess(cmd);
        if(!success) return;

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

        let cmd = this.generateExecCommand(slide, process);
        this.executeRevealProcess(cmd);
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
        this.executeRevealProcess(cmd);
    },
    generateExecCommand: function(slide, process) {
        let design = slide.design || slide.getDataValue('design');
        if(design === 'CustomCSS') {
            design = slide.css || slide.getDataValue('css');
        }
        let motion = slide.motion || slide.getDataValue('motion');
        let path = slide.markdown_path || slide.getDataValue('markdown_path');
        let port = process.port || process.getDataValue('port');
        if(!design || !motion || !path || !port) {
            console.log('returning false : ' + design + ", " + motion + "," + path + ", " + port);
            return false;
        }

        let options = [];
        options.push('-p');
        options.push(port);
        options.push('--theme');
        options.push(design);
        options.push('--transition');
        options.push(motion);
        options.push(path);

        return options;
    },
    killProcess: async function(port) {
        const {stdout, stderr} = await exe(`lsof -i:${port}`, {shell: true}).catch((err) => {
            return;
        });

        if(!stdout) return;

        let lines = stdout.split('\n');

        if(lines.length < 2) return;
        let pid = lines[1].split(' ')[1];
        spawn('kill', [pid]);
    },
    generateCSS: async function(slide, process, username) {
        let cssPath = `uploads/${username}-${slide.getDataValue('design')}.css`;
        let cssExists = false;
        try {
            fs.statSync(cssPath);
            cssExists = true;
        } catch(err) {}
        
        if(cssExists) return cssPath;

        let cmd = 'curl http://localhost:';
        cmd += process.getDataValue('port');
        cmd += '/revealjs/css/theme/';
        cmd += slide.getDataValue('design');
        cmd += '.css > ';
        cmd += cssPath;

        await exe(cmd, {shell: true});
        return cssPath;
    }
}
