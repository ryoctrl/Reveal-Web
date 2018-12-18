const models = require('../models');
const fs = require('fs');

module.exports = {
    createNewSlide: async function(uid) {
        let query = {
            where: {
                user_id: uid
            }
        };
        let record = await models.slides.findOne(query);
        
        if(record) {
            let errObj = {
                err: true,
                message: '既にマークダウンが存在します'
            };
            return errObj;
        }

        let path = 'uploads/' + uid + '-markdown.md';

        fs.copyFile('templates/template.md', path, (err) => {
            console.error(err);
        });

        const slideObj = {
            user_id: uid,
            markdown_path: path,
            design: 'black',
            motion: 'default'
        };
        record = await models.slides.create(slideObj);
        return {
            err: false,
            record: record
        };
    }
}
