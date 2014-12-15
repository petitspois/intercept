/*! intercept.js 0.0.1 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if (typeof exports === 'object') {
        module.exports = factory;
    } else {
        root['$it'] = factory;
    }
})(this, function (options) {

    "use strict";

    var op = Object.prototype;

    var firefox = !!window.netscape;

    var go = firefox ? 'blur' : 'focusout';

    var i8 = !!('\v' == 'v');

    //forms集合
    var ruleArray = {};

    //简单过滤后的dom,以及初始状态
    var controller = {};

    var flawless = [];

    var it = function (selector) {
        var self = it.prototype,
            elements = [];
        if (typeof selector === 'string') {
            elements = $.toArray(document.querySelectorAll(selector));
        } else if (typeof selector === 'object' && selector.attributes) {
            elements = [selector];
        }
        self._elem = elements;
        return self;
    }

    ////////////////////
    // 为it添加工具方法 //
    ////////////////////

    it.prototype = {

        version: '0.0.1',

        constructor: it,

        trim: function (str) {
            return str.replace(/^\s+|\s+$/g, '');
        },

        isEmptyObject: function (obj) {
            var name;
            for (name in obj) {
                return false;
            }
            return true;
        },
        mixIn: function (target) {
            for (var i = 1, arg, args = arguments; arg = args[i++];) {
                if (arg !== target) {
                    for (var prop in arg) {
                        target[prop] = arg[prop];
                    }
                }
            }
            return target;
        },
        toArray: function (iterable) {
            if (i8) {
                var len = iterable.length, arr = new Array(len);
                while (len--)
                    arr[len] = iterable[len];
                return arr;
            }
            return [].slice.call(iterable);
        },
        getItAttr: function (attrs) {
            var itA = [], i = 0, attr,
                chaos = $.toArray(attrs);
            while (attr = chaos[i++]) {
                var nodeName = attr.nodeName;
                if (nodeName !== 'it-messages') {
                    (nodeName.charAt(2) === '-' && nodeName.slice(0, 2) === 'it') && itA.push(attr);
                } else {
                    itA.unshift(attr);
                }
            }
            return itA;
        },
        camelize: function (target) {
            return target.replace(/[-][^-]/g, function (match) {
                return match.charAt(1).toUpperCase();
            });
        },
        siblings: function () {
            var self = this,
                node = self._elem[0];
            if (node.nextElementSibling) {
                return node.nextElementSibling;
            }
            while ((node = node.nextSibling) && node.nodeType !== 1);
            return node;
        },
        isAll: function () {
            return !!defaults['all'];
        }
    }

    ////////////////////
    // 为it添加基础方法 //
    ////////////////////
    /* form--初始化 */
    it.prototype.init = function () {
        var formCollection = document.forms;
        if (!formCollection.length)return;
        loop : for (var i = 0, el; el = formCollection[i++];) {
            var elAttr = el.getAttribute('it-controller');
            if (typeof elAttr === 'string') {
                if (!!$.trim(elAttr)) {
                    ruleArray[elAttr] = el;
                } else {
                    ruleArray = el;
                    break loop;
                }
            }
        }
        //获得整洁的it字段
        $.getNeatField();
    }

    //获取纯洁处理对象
    it.prototype.getNeatField = function () {
        if (!$.isEmptyObject(ruleArray)) {
            ruleArray = ruleArray.nodeName ? {'it': ruleArray} : ruleArray;
            for (var prop in ruleArray) {
                var frChild = ruleArray[prop].elements;
                controller[prop] = {};
                controller[prop]['status'] = false;
                controller[prop]['elem'] = [];
                for (var i = 0, el; el = frChild[i++];) {
                    if ($.filterType(el)) {
                        controller[prop]['elem'].push(el);
                    }
                }
            }
        } else {
            throw new SyntaxError('请确认表单form标签已有"it-controller"属性!');
        }
    }

    //简单的serialize
    it.prototype.filterType = function (node) {
        switch (node.type) {
            case undefined:
            case 'file':
            case 'submit':
            case 'reset':
            case 'button':
            case 'fieldset':
            case  'radio':
            case  'checkbox':
                break;
            default:
                if (node.name.length) {
                    return true;
                }
        }
    }

    /* formelements 事件捆绑 */
    it.prototype.events = function () {
        controller && void function () {
            var prop, el;
            for (prop in controller) {
                var i = 0;
                while (el = controller[prop]['elem'][i++]) {
                    switch (el.type) {
                        case 'select-one':
                        case 'select-multiple':
                            void function (p) {
                                $.watch(p, el.name, el);
                                it(el).on('change', function () {
                                    var me = this;
                                    $scope[p + '$' + me.name] = me.value;
                                    $scope.$digest();
                                });
                            }(prop);
                            break;
                        default:
                            void function (p) {
                                $.watch(p, el.name, el);
                                it(el).on(go, function () {
                                    var me = this;
                                    $scope[p + '$' + me.name] = me.value;
                                    $scope.$digest();
                                });
                            }(prop);
                    }
                }
            }
        }();
    }
    /*   绑定watch  */
    it.prototype.watch = function (controller, name, elem) {
        $scope.$watch(function () {
            return $scope[controller + '$' + name];
        }, function (newValue) {
            var itArray = $.getItAttr(elem.attributes),
                itLen = itArray.length, i = 0, ii, node, mg;
            while (node = itArray[i++]) {
                var filterName = $.camelize(node.nodeName),
                    mess = !!$.Observer[filterName],
                    isVia = $scope.$filter[filterName] && $scope.$filter[filterName](newValue, node.value),
                    control = controller;
                if (isVia || (mess && (mg = node.value))) {
                    void function () {
                        ii = i
                    }();
                    if (itLen !== ii) continue;
                    //是否有flawless
                    flawless[control] = flawless[control] || {};
                    //插入验证成功数据
                    flawless[control][name] = newValue;
                    //执行媒体操作
                    $.Observer.itMessages.success(mg, elem, control);
                } else {
                    $.Observer.itMessages.error(mg, elem, control);
                    break;
                }
            }
            //执行过滤行为
        });
    }

    it.prototype.on = function (event, fn) {
        var self = this,
            elements = self._elem;
        for (var i = 0, el; el = elements[i++];) {
            if (document.addEventListener) {
                el.addEventListener(event, fn, false);
            } else if (document.attachEvent) {
                var ele = el;
                ele.attachEvent('on' + event, function () {
                    fn.call(ele, window.event);
                });
            }
        }
    }

    it.prototype.ready = function (callback) {
        var fired = false;

        function trigger() {
            if (fired) return;
            fired = true;
            callback();
        }

        if (document.readyState === 'complete') {
            setTimeout(trigger);
        } else if (document.addEventListener) {
            document.addEventListener('DOMContentLoaded', trigger, false);
            window.addEventListener('load', trigger, false);
        } else {
            document.attachEvent('onreadystatechange', function () {
                if (document.readyState === 'complete') {
                    trigger();
                }
            });
        }
    }

    ////////////////
    //   信息中心  //
    ////////////////


    it.prototype.Observer = {
        itMessages: {
            success: function (mess, el) {
                mess = mess.split('|')[0];
                this.trusteeship(mess, el);
            },
            error: function (mess, el) {
                mess = mess.split('|')[1];
                this.trusteeship(mess, el);
            },
            warning: function () {

            },
            trusteeship: function (content, el) {
                var control = el.form.getAttribute('it-controller'),
                    option = $.isAll() ? defaults['all'] : defaults[control],
                    node = option['messDepth'] === 'sibling' ? it(el).siblings() : false;
                if (node) {
                    node.innerHTML = content;
                } else {
                    if (option['messDepth'] === 'children') {
                        it(el).siblings().children[0].innerHTML = content
                    } else {
                        throw new SyntaxError('请正确填写"messDepth"值!');
                    }
                }

            }
        }
    }

    //////////////
    //   watch  //
    //////////////

    var Scope = function () {
        this.$$watchers = [];
    }

    Scope.prototype.$watch = function (watchExp, listener) {
        this.$$watchers.push({
            watchExp: watchExp,
            listener: listener || function () {
            }
        });
    }

    Scope.prototype.$digest = function () {
        var dirty;
        do {
            var i = 0, watcher;
            dirty = false;
            while (watcher = this.$$watchers[i++]) {
                var newValue = watcher.watchExp(),
                    oldValue = watcher.last;
                oldValue !== newValue && (
                    watcher.listener(newValue),
                        dirty = true,
                        watcher.last = newValue
                );
            }
        } while (dirty);
    }

    Scope.prototype.$filter = {
        'itMaxlength': function () {
            var args = $.toArray(arguments);
            return args[0].length <= (+args[1]);
        }
    }


    //////////////
    //   实例化  //
    //////////////

    var $ = new it();

    var $scope = new Scope();

    var originDefaults = {
            'messDepth': 'children',
            'tap': 'click'
        },
        defaults = {};

    //合并基础配置
    if(typeof options==='object' && !$.isEmptyObject(options)) {
        for (var prop in options) {
            defaults[prop] = $.mixIn({}, originDefaults);
            $.mixIn(defaults[prop], options[prop]);
        }
    }else{
        defaults.all = originDefaults;
    }
    //domReady自动运行
    $.ready(function () {
        //初始化获得纯净form-elements
        $.init();
        //绑定事件处理
        $.events();

    });

    //返回公共对象
    return {'version': $.version, 'url': 'qingdou.me'}

});


