alertify.genericDialog || alertify.dialog('genericDialog', function() {
    return {
        main: function(content) {
            this.setContent(content);
        },
        setup: function() {
            return {
                focus: {
                    element: function() {
                        return this.elements.body.querySelector(this.get('selector'));
                    },
                    select: true
                },
                options: {
                    maximizable: false,
                    resizable: false,
                    padding: false
                }
            };
        },
        settings: {
            selector: undefined,
            tt: undefined
        },
    };
});
