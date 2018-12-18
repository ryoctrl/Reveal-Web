const checkSessionActivatedAndGenerateMessagesIfNeeded = req => {
    if(!req.hasOwnProperty('session')){
        throw new Error('Session is not activated');
        return;
    }
    if(!req.session.hasOwnProperty('messages')) req.session.messages = [];
};

module.exports = {
    dequeueAllMessages: req => {
        if(!req.session) return [];

        let sessionMessages = req.session.messages || [];
        let messages = [];
        while(sessionMessages.length > 0) messages.push(sessionMessages.shift());
        return messages;
    },
    addMessage: (req, obj) => {
        checkSessionActivatedAndGenerateMessagesIfNeeded(req);
        if(!obj.hasOwnProperty('message')) {
            throw new Error('message object does not have message property');
            return;
        }
        if(!obj.hasOwnProperty('isError')) {
            obj.isError = false;
        }
        req.session.messages.push(obj);
    },
    addError: function(req, msg) {
        this.addMessage(req, {
            message: msg,
            isError: true
        });
    },
    addSuccess: function(req, msg) {
        this.addMessage(req, {
            message: msg,
            isError: false
        });
    },
}
