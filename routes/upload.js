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

router.post('/', upload.single('markdown'), (req, res, next) => {
    let user = req.session.user;
    if(!user) {
        fs.unlink(file.path, (err) => {});
        res.redirect('/');
        return;
    }

    if(req.file.mimetype != 'text/markdown') {
        const err = {
            message: 'Markdownファイルのみアップロードすることができます'
        };
        req.session.err = err;
        res.redirect(`users/${user.name}`);
    }

    //正規のユーザーからpostされたらslidesレコードを作成しプロセスを起動しprocessレコードを作成する
    let path = req.file.path;
    query = {
        where: {
            user_id: user.id
        }
    }
    models.slides.findOne(query).then((record) => {
        if(!record) {
            const slidesObj = {
                user_id: user.id,
                markdown_path: path
            }
            models.slides.create(slidesObj)
                .then((record) => {
                    reveal.runAsNewProcess(path, () => {
                        res.redirect(`users/${user.name}`);
                        return;
                    });
                    return;
                }).catch((err) => {
                    console.log(err);
                    return;
                });
            return;
        }

        let oldPath = record.getDataValue('markdown_path');
        fs.rename(path, oldPath, (err) => {
            if(err) console.log(err);
            return;
        });
    }).catch((err) => {
        console.log('find error');
    });
});


module.exports = router;
