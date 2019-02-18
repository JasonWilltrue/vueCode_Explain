/**
 * 大括号表达式
 * 1.用正则取出name
 * 2. 从data中取出表达式对应的属性值
 * 3.将属性值设置为文本节点的textContet
 * 
 * 
 * 事件指令
 * 1.指令名中取出事件名
 * 2.指令值表达式函数对象是否存在
 * 3.给元素节点绑定事件及回调函数dom事件监听
 * 4.指令解析完成后，移除指令属性
 * 
 * 
 * 
 * 
 * 
 * 
 * @param {*} el 
 * @param {*} vm 
 */

function Compile(el, vm) {
    // 保存vm对象到compile中
    this.$vm = vm;
    this.$el = this.isElementNode(el) ? el : document.querySelector(el);
    // 如果有el元素才执行
    if (this.$el) {
        // 取出el元素中所有子节点保存到fragment中
        this.$fragment = this.node2Fragment(this.$el);
        // 编译所有层次的子节点
        this.init();
        //编译好的el元素添加到页面el元素中
        this.$el.appendChild(this.$fragment);
    }
}

Compile.prototype = {
    node2Fragment: function (el) {
        var fragment = document.createDocumentFragment(),
            child;

        // 将原生节点拷贝到fragment
        while (child = el.firstChild) {
            fragment.appendChild(child);
        }

        return fragment;
    },

    init: function () {
        // 编译节点所有层次的子节点
        this.compileElement(this.$fragment);
    },

    compileElement: function (el) {
        // 取出最外层的子节点
        var childNodes = el.childNodes,
            me         = this;           //this-> compile实例

        [].slice.call(childNodes).forEach(function (node) {
            var text = node.textContent;
            var reg  = /\{\{(.*)\}\}/; // 匹配{{name}} 加小括号是为了$1 ==name

            if (me.isElementNode(node)) {
                // 编译事件指令
                me.compile(node); //是否有指令属性
                // 是文本节点吗 有{{}} 吗
            } else if (me.isTextNode(node) && reg.test(text)) {
                me.compileText(node, RegExp.$1);
            }
            //  是否有子节点
            if (node.childNodes && node.childNodes.length) {
                me.compileElement(node);
            }
        });
    },

    compile: function (node) {
        // 得到所有属性的伪数组
        var nodeAttrs = node.attributes,
            me        = this;

        [].slice.call(nodeAttrs).forEach(function (attr) {
            // 得到属性名
            var attrName = attr.name;
            // 判断是否指令属性
            if (me.isDirective(attrName)) {
                var exp = attr.value;
                var dir = attrName.substring(2);
                // 判断是否事件指令
                if (me.isEventDirective(dir)) {
                    // 处理解析事件指令
                    compileUtil.eventHandler(node, me.$vm, exp, dir);
                    // 普通指令
                } else {
                    compileUtil[dir] && compileUtil[dir](node, me.$vm, exp);
                }
                // 最后移除指令属性
                node.removeAttribute(attrName);
            }
        });
    },

    compileText: function (node, exp) {
        compileUtil.text(node, this.$vm, exp);
    },

    isDirective: function (attr) {
        return attr.indexOf('v-') == 0;
    },

    isEventDirective: function (dir) {
        return dir.indexOf('on') === 0;
    },

    isElementNode: function (node) {
        return node.nodeType == 1;
    },

    isTextNode: function (node) {
        return node.nodeType == 3;
    }
};

// 指令处理集合
var compileUtil = {
    text: function (node, vm, exp) {
        this.bind(node, vm, exp, 'text');
    },

    html: function (node, vm, exp) {
        this.bind(node, vm, exp, 'html');
    },

    model: function (node, vm, exp) {
        this.bind(node, vm, exp, 'model');

        var me  = this,
            val = this._getVMVal(vm, exp);
        node.addEventListener('input', function (e) {
            var newValue = e.target.value;
            if (val === newValue) {
                return;
            }

            me._setVMVal(vm, exp, newValue);
            val = newValue;
        });
    },

    class: function (node, vm, exp) {
        this.bind(node, vm, exp, 'class');
    },

    bind: function (node, vm, exp, dir) {
        // 得到更新节点函数
        var updaterFn = updater[dir + 'Updater'];
        // 调用更新节点
        updaterFn && updaterFn(node, this._getVMVal(vm, exp));

        new Watcher(vm, exp, function (value, oldValue) {
            updaterFn && updaterFn(node, value, oldValue);
        });
    },

    // 事件处理
    eventHandler: function (node, vm, exp, dir) {
        // 得到事件名  click
        var eventType = dir.split(':')[1],
        // 从methods中得到表达式所对应的事件是否存在
            fn = vm.$options.methods && vm.$options.methods[exp];
        // 如果都存在
        if (eventType && fn) {
            node.addEventListener(eventType, fn.bind(vm), false);
        }
    },
    //   从vm中得表达式对于的值
    _getVMVal: function (vm, exp) {
        var val = vm._data;
            exp = exp.split('.');
        exp.forEach(function (k) {
            val = val[k];
        });
        return val;
    },

    _setVMVal: function (vm, exp, value) {
        var val = vm._data;
            exp = exp.split('.');
        exp.forEach(function (k, i) {
            // 非最后一个key，更新val的值
            if (i < exp.length - 1) {
                val = val[k];
            } else {
                val[k] = value;
            }
        });
    }
};

// 包含多个更新节点方法的工具对象
var updater = {
    textUpdater: function (node, value) {
        node.textContent = typeof value == 'undefined' ? '' : value;
    },

    htmlUpdater: function (node, value) {
        node.innerHTML = typeof value == 'undefined' ? '' : value;
    },

    classUpdater: function (node, value, oldValue) {
        var className = node.className;
            className = className.replace(oldValue, '').replace(/\s$/, '');

        var space = className && String(value) ? ' ' : '';

        node.className = className + space + value;
    },

    modelUpdater: function (node, value, oldValue) {
        node.value = typeof value == 'undefined' ? '' : value;
    }
};