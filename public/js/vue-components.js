let listener = {
    methods: {
        select: function(event) {
            let text = event.target.innerText;
            this.$emit('set', text);
            this.$emit('hide');
        },
        listen: function(target, eventType, callback) {
            if(!this._eventRemovers) {
                this._eventRemovers = [];
            }

            target.addEventListener(eventType, callback);
            this._eventRemovers.push( {
                remove: function() {
                    target.removeEventListener(eventType, callback)
                }
            });
        }
    },
    destroyed: function() {
        if(this._eventRemovers) {
            this._eventRemovers.forEach(function(eventRemover) {
                eventRemover.remove();
            });
        }
    }
};
Vue.component('dropdown-menu', {
    mixins:[listener],
    template: `
    <div id="dropdown-wrapper">
        <div class="menu-item" @click="select" v-for="item in items"> {{ item }} </div>
    </div>
    `,
    created: function() {
        this.listen(window, 'click', function(e) {
            if(!this.$el.contains(e.target)) {
                this.$emit('close');
            }
        }.bind(this));
    },
    props: ['items']
});
