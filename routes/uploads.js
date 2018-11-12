const express = require('express')
const router = express.Router();
const fs = require('fs');

router.get('/*', async(req, res, next) => {
    let user = req.session.user;
    if(!user) {
        res.status(403);
        res.end();
        return;
    }

    let f = req.originalUrl.substr(1);
    fs.createReadStream(f).once('open', function() {
        this.pipe(res);
    });
    return;
});

module.exports = router;
