const express = require('express')
const router = express.Router();
const multer  = require('multer')
const uploadPath = 'uploads/'
const upload = multer({ dest: uploadPath })
const fs = require('fs');
const models = require('../models');
const reveal = require('../controllers/revealgo.js').reveal;

/*
{ fieldname: 'markdown',
  originalname: 'TestMarkdown.md',
  encoding: '7bit',
  mimetype: 'text/markdown',
  destination: 'uploads/',
  filename: '9b47c3bbcc0ad6b7a0deb02be5370d21',
  path: 'uploads/9b47c3bbcc0ad6b7a0deb02be5370d21',
  size: 174 }
  */

router.post('/', upload.single('markdown'), async (req, res, next) => {
    if(!req.session.msg) req.session.msg = {};
    let user = req.session.user;
    let file = req.file;
    if(!user) {
        fs.unlink(file.path, (err) => {});
        res.redirect('/');
        return;
    }

    if(!req.file.originalname.endsWith('.md')) {
        fs.unlink(file.path, (err) => {});
        req.session.msg.users = ['Markdownファイルのみアップロードすることができます'];
        res.redirect(`users/${user.name}`);
        return;
    }

    //正規のユーザーからpostされたらslidesレコードを作成しプロセスを起動しprocessレコードを作成する
    let path = req.file.path;
    query = {
        where: {
            user_id: user.id
        }
    }

    let record = await models.slides.findOne(query);

    if(!record) {
        console.log('slide record not found! creating new slide and process record');
        const slideObj = {
            user_id: user.id,
            markdown_path: path,
            design: 'black',
            motion: 'default'
        };
        record = await models.slides.create(slideObj);
        reveal.runAsNewProcess(record, () => {
            res.redirect(`users/${user.name}`);
            return;
        });
        return;
    }

    let oldPath = record.markdown_path || record.getDataValue('markdown_path');
    fs.rename(path, oldPath, (err) => {
        if(err) {
            console.error('an error occured where routes/upload.js/post:/');
            console.error(err);
        }
        return;
    });
    res.redirect(`users/${user.name}`);
});

/*
{ fieldname: 'resource',
originalname: 'キャプチャ.PNG',
encoding: '7bit',
mimetype: 'image/png',
destination: 'uploads/',
filename: '66bfef2f4b089fa73d0e9c336c2db504',
path: 'uploads/66bfef2f4b089fa73d0e9c336c2db504',
size: 947485 }
*/
router.post('/resources', upload.single('resource'), async(req, res, next) => {
    let user = req.session.user;
    let file = req.file;
    if(!user) {
        fs.unlink(file.path, (err) => {});
        res.status(403);
        res.end('Authentication Error');
        return;
    }

    if(!file) {
        res.status(400);
        res.end('Bad Request');
        return;
    }

    //正規のユーザーからpostされたresourceのレコードを作成する
    let path = file.path;
    let name = file.originalname;
    let uid = user.id;
    const resourceObj = {
        user_id: uid,
        path: path,
        name: name
    };

    models.resources.create(resourceObj)
        .then(() => {})
        .catch((err) => {
            console.error('an error has occured where routes/upload.js/resources post');
            console.error(err);
        });

    res.status(200);
    res.send(JSON.stringify({
        name: name,
        path: path
    }));
});

router.post('/delete', async(req, res, next) => {
    let user = req.session.user;
    if(!user) {
        res.status(403);
        res.end('Authentication error');
        return;
    }

    let delId = req.body.id;

    if(!delId) {
        res.status(400);
        res.end('Bad Request');
        return;
    }

    let query = {
        where: {
            user_id: user.id,
            path: delId
        }
    }

    let record = await models.resources.findOne(query);

    if(!record) {
        res.status(404);
        res.end('no such file');
        return;
    }

    let result = await record.destroy();

    fs.unlinkSync(delId);

    res.status(200);
    res.end('delete success');
});

module.exports = router;
