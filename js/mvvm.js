function MVVM(options) {
                this.$options = options;
            var data          = this._data = this.$options.data;
            var me            = this;

    // 数据代理
    // 实现 vm.xxx -> vm._data.xxx
    Object.keys(data).forEach(function(key) {
        // 对指定属性的代理
        me._proxy(key);
    });

    observe(data, this);
    // 创建一个编译的对象 编译解析我们的模板
    this.$compile = new Compile(options.el || document.body, this)
}

MVVM.prototype = {
    $watch: function(key, cb, options) {
        new Watcher(this, key, cb);
    },

    _proxy: function(key) {
        var me = this;
        Object.defineProperty(me, key, {
            configurable: false,
            enumerable  : true,
            get         : function proxyGetter() {
                return me._data[key];
            },
            set: function proxySetter(newVal) {
                me._data[key] = newVal;
            }
        });
    }
};