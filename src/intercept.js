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


    var Pme = null;

    var op = Object.prototype;

    var firefox = !!window.netscape;

    var go = firefox ? 'blur' : 'focusout';

    var i8 = !!('\v' == 'v');

    var hook = '该字段验证通过!';

    var isRequiredSupported = "required" in document.createElement("input");

    //forms集合
    var ruleArray = {};

    //简单过滤后的dom,以及初始状态
    var controller = {};

    //需要验证的模组

    var modules = {};

    //password队列

    var passCollection = [];

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

    //常用正则表达式
    //匹配数字
    var rNumber = /^\d+$/g,

        //中文字符
        rChinese = /[\u4e00-\u9fa5]/,

        //email
        rEmail = /[\w!#$%&'*+/=?^_`{|}~-]+(?:\.[\w!#$%&'*+/=?^_`{|}~-]+)*@(?:[\w](?:[\w-]*[\w])?\.)+[\w](?:[\w-]*[\w])?/,

        //网址url
        rHttpUrl = /[a-zA-z]+:\/\/[^\s]*/,

        //qq号码
        rQQ = /[1-9][0-9]{4,}/,

        //国内电话
        rPhone = /\d{3}-\d{8}|\d{4}-\{7,8}/;



    ////////////////////
    // 为it添加工具方法 //
    ////////////////////

    it.prototype = {

        version: '0.0.1',

        constructor: it,

        trim: function (str, ctrl) {
            ctrl = defaults[ctrl] || defaults['all'] || {trim:false};
            return ctrl['trim'] ? str.replace(/^\s+|\s+$/g, '') : str;
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
        isNaN : function(value){
            return value !== value;
        },
        hasOwn: function (obj, prop) {
            return op.hasOwnProperty.call(obj, prop);
        },
        indexOf: function (searchobj, searchvalue) {
            return String.prototype.indexOf.call(searchobj, searchvalue);
        },
        getBytes : function(str){
            return str.replace(/[^\x00-\xff]/g, "**").length;
        },
        getItAttr: function (attrs) {
            var itA = [],
                i = 0,
                attr,
                pass,
                nodeName,
                must,
                async,
                chaos = $.toArray(attrs);
                must = async = pass = false;
            while (attr = chaos[i++]) {
                nodeName = attr.nodeName;
                switch (nodeName) {
                    case 'it-messages':
                        itA.unshift(attr);
                        break;
                    case 'required':
                        must = true;
                        break;
                    case 'it-async':
                        async = true;
                        break;
                    case 'it-password':
                        pass = true;
                        break;
                    default :
                        (nodeName.charAt(2) === '-' && nodeName.slice(0, 2) === 'it') && itA.push(attr);
                }
            }

            //密码处理
            pass && (itA.push('it-password'));
            //异步最后处理
            async && (itA.push('it-async'));
            //required为第二处理,只要存在it属性就为必填字段
            itA.length > 0 && itA[0]['nodeName'] == 'it-messages' ? itA.splice(1,0,'required') :itA.unshift('required');
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
        ajax: function (options) {
            options = options || {};
            options.type = (options.type || 'GET').toUpperCase();
            options.dataType = options.dataType || 'json';
            options.timeout = options.timeout || 15000;
            var promise = new Pme(function (resolve, reject) {
                //第一步创建
                var xhr = new XMLHttpRequest(), json, err;
                //第三步接受
                xhr.onreadystatechange = function () {
                    //xhr状态
                    if (xhr.readyState === 4) {
                        //服务器返回状态
                        var status = xhr.status,
                            responseText = xhr.responseText;
                        if ((status >= 200 && status < 300) || status === 304) {
                            clearTimeout(xhrTimeout);
                            switch (options.dataType) {
                                case 'json':
                                    try {
                                        json = JSON.parse(responseText);
                                    } catch (_err) {
                                        err = _err;
                                    }
                                    resolve(json, err);
                                    break;
                                default:
                                    resolve(responseText, null);
                            }
                        } else {
                            reject(status);
                        }
                    }
                }
                //第二步,连接以及发送
                if (options.type === 'GET') {
                    xhr.open('GET', options.url + '?' + options.data, true);
                    xhr.send(null);
                } else {
                    xhr.open('POST', options.url, true);
                    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                    xhr.send(options.data);
                }
                var xhrTimeout = setTimeout(ajaxTimeout, options.timeout);

                function ajaxTimeout() {
                    xhr.abort();
                    reject();
                }
            });

            return promise;
        },
        warn: function (msg) {
            console.warn('[it warn]: ' + msg);
        },
        isAll: function () {
            return !!defaults['all'];
        },
        novalidate: function (control) {
            isRequiredSupported && (ruleArray[control]['noValidate'] = true);
        },
        getEvent: function (event) {
            return event ? event : window.event;
        },
        preventDefault: function (event) {
            event.preventDefault ? event.preventDefault() : event.returnValue = false;
        },
        /**
         *
         * 获取信息内容
         * @param {number} type 0=>成功,1=>失败,2=>提示
         * @param {string} mess 提示信息
         * @param {string} ctrl 控制范围
         * @param {object} el 当前元素
         * @param {string} frNe 过滤属性
         */
        getMess: function (mess, type, ctrl, el, frNe) {
            var elName = el.name,
                messContent;
                ctrl = defaults[ctrl] || defaults['all'];

                messContent = !!ctrl['messContent'] && ctrl['messContent'][elName];

            if (!!mess) {  //dom上有it-messages的情况
                var messColl = mess.split('|');
                return this.returnMess(messColl, type, ctrl, elName, frNe);
            } else {
                //$it({}) 配置项 default=>ctrl=>'messContent'=>currentName
                if (messContent) {
                    return this.returnMess(messContent, type, ctrl, elName, frNe);

                    //启用默认
                } else {
                    return this.returnMess(ctrl['defaultMess'][frNe], type);
                }
            }

        },
        returnMess: function (messColl, type, ctrl, elName, frNe) {
            if (typeof messColl[type] == 'undefined') {
                var messCon = ctrl['messContent'] || false,
                    name = messCon && messCon[elName];
                if (name && name[type] !== undefined) {
                    return ctrl['messContent'][elName][type];
                }
                return ctrl['defaultMess'][frNe][type];
            };
            return messColl[type];
        },
        serialize: function (form) {
            var parts = [],
                i = 0,
                j = 0,
                field = null,
                elems,
                option,
                optValue;
            elems = form.elements;
            while (field = elems[i++]) {
                switch (field.type) {
                    case 'select-one':
                    case 'select-multiple':
                        if (field.name.length) {
                            while (option = field.options[j++]) {
                                if (option.selected) {
                                    optValue = '';
                                    if (option.hasAttribute) {
                                        optValue = option.hasAttribute('value') ? option.value : option.text;
                                    } else {
                                        optValue = options.attributes['value'].specified ? option.value : option.text;
                                    }
                                    parts.push(encodeURIComponent(field.name) + '=' + encodeURIComponent(optValue));
                                }
                            }
                        }
                        break;
                    case undefined:
                    case 'file':
                    case 'submit':
                    case 'reset':
                    case 'button':
                        break;
                    case 'radio':
                    case 'checkbox':
                        if (!field.checked) {
                            break;
                        }
                    default:
                        if (field.name.length) {
                            parts.push(encodeURIComponent(field.name) + '=' + encodeURIComponent(field.value));
                        }
                }
                ;
            }
            return parts.join('&');
        }
    }

    /////////////////
    // es6 Promise //
    /////////////////

    var isPromise = false;

    try {
        Pme = Promise;
    } catch (e) {
        isPromise = true;
    }

    isPromise && typeof function () {
        var Promise = function (fn) {
            var that = this,
                resolve = function (val) {
                    that.resolve(val);
                },
                reject = function (val) {
                    that.reject(val);
                };
            that.status = 'pending';
            that.resolveFn = null;
            that.rejectFn = null;
            typeof fn === 'function' && fn(resolve, reject);
        }
        Promise.prototype.resolve = function (val) {
            if (this.status === 'pending') {
                this.status = 'fulfilled';
                this.resolveFn && this.resolveFn(val);
            }
        }
        Promise.prototype.reject = function (val) {
            if (this.status === 'pending') {
                this.status = 'rejected';
                this.rejectFn && this.rejectFn(val);
            }
        }
        Promise.prototype.then = function (resolve, reject) {
            var borrow = new Promise();
            this.resolveFn = function (val) {
                var result = resolve ? resolve(val) : val;
                if (Promise.isP(result)) {
                    result.then(function (val) {
                        borrow.resolve(val);
                    });
                } else {
                    borrow.resolve(result);
                }
            }
            this.rejectFn = function (val) {
                var result = reject ? reject(val) : val;
                borrow.reject(result);
            }
            return borrow;
        }
        Pme = Promise;
    }();

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
            var frChild;
            ruleArray = ruleArray.nodeName ? {'it': ruleArray} : ruleArray;
            for (var prop in ruleArray) {
                if ($.hasOwn(ruleArray, prop)) {
                    frChild = ruleArray[prop].elements;
                    controller[prop] = {};
                    controller[prop]['elem'] = [];
                    for (var i = 0, el; el = frChild[i++];) {
                        if ($.filterType(el)) {
                            controller[prop]['elem'].push(el);
                        }
                    }
                }
            }
        } else {
            $.warn('请确认表单form标签已有"it-controller"属性!');
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
            var prop, el, data;
            for (prop in controller) {
                var i = 0, local;
                if ($.hasOwn(controller, prop)) {
                    while (el = controller[prop]['elem'][local = i++]) {
                        //需要验证的字段，绑定事件
                        if (!$.getItAttr(el.attributes).length)break;
                        data = {'elem': el, 'status': false };
                        modules[prop] = modules[prop] || [];
                        modules[prop]['push'](data);
                        //绑定事件
                        switch (el.type) {
                            case 'select-one':
                            case 'select-multiple':
                                void function (p, local) {
                                    $.watch(p, el.name, el, local);
                                    it(el).on('change', function () {
                                        var me = this;
                                        $scope[p + '$' + me.name] = me.value;
                                        $scope.$digest();
                                    });
                                }(prop, local);
                                break;
                            default:
                                void function (p, local) {
                                    $.watch(p, el.name, el, local);
                                    it(el).on(go, function () {
                                        var me = this;
                                        $scope[p + '$' + me.name] = me.value;
                                        $scope.$digest();
                                    });
                                }(prop, local);
                        }
                    }
                }
            }
        }();
    }
    /*   绑定watch  */
    it.prototype.watch = function (controller, name, elem, index) {
        $scope.$watch(function () {
            return $scope[controller + '$' + name];
        }, function (newValue) {
            var ii,
                mg,
                node,
                isVia,
                itasync,
                isAsync,
                isSuccess,
                statusAndMess,
                i = 0,
                control = controller,
                itArray = $.getItAttr(elem.attributes),
                itLen = itArray.length;

            isAsync = !($.indexOf(itArray, 'it-async') === -1) && !!itArray.pop();
            isAsync && (itLen--);
            while (node = itArray[i++]) {
                var filterName = $.camelize(node.nodeName || node),
                    mess = !!$.Observer[filterName];
                //集合第一条为it-messages,对mg进行赋值
                mess && (mg = node.value);
                //集合第一条不为it-messages
                //$scope.$filter.filtername args(原始值，当前字段属性值，控制器范围)
                typeof function(ind){
                    !mess && (isVia = $scope.$filter[filterName] && $scope.$filter[filterName](newValue, (node.value || node), control, name, ind, elem, mg));
                }(index);
                //验证返回值或信息为true时
                if (isVia || mess) {
                    typeof function () {
                        ii = i
                    }();
                    if (itLen !== ii) continue;
                    statusAndMess = function (status) {
                        //改变验证状态
                        typeof function (ind) {
                            modules[control][ind]['status'] = status = status!==undefined ? status : true;
                        }(index);
                        //执行媒体操作
                        status?
                            $.Observer.itMessages.success(mg, elem, control, filterName):
                            $.Observer.itMessages.error(mg, elem, control, filterName);
                    }

                    //如果存在异步字段
                    if (isAsync) {
                        itasync = $scope.$filter.itAsync(newValue, (node.value || node), control, name);
                        itasync.then(function () {
                            statusAndMess(true);
                        }, function () {
                            statusAndMess(false);
                        });
                    } else {
                        statusAndMess();
                    }

                } else {
                    //非it内部属性处理
                    if (isVia === undefined) {
                        //无属性时，设置状态为true
                        typeof function (ind) {
                            modules[control][ind]['status'] = true;
                        }(index);
                        $.warn('存在非intercept内部属性!');
                        continue;
                    };
                    //改变验证状态
                    typeof function (ind) {
                        modules[control][ind]['status'] = false;
                    }(index);
                    //执行媒体操作
                    $.Observer.itMessages.error(mg, elem, control, filterName);
                    break;
                }
            }
            //执行过滤行为
        });
    }
    //提交处理
    it.prototype.submit = function () {
        for (var ctrl in controller) {
            //阻止高级浏览器验证
            if ($.hasOwn(controller, ctrl)) {
                $.novalidate(ctrl);
                typeof function (ctrl) {
                    it(ruleArray[ctrl]).on('submit', function (e) {
                        var staObj, pointer = false, i = 0, e = $.getEvent(e);
                        while (staObj = modules[ctrl][i++]) {
                            if (!staObj.status) {
                                $.trigger(staObj.elem, 'focusout');
                                pointer = true;
                                break;
                            }
                        }
                        console.log(modules[ctrl])
                        //拦截验证失败时
                        pointer && $.preventDefault(e);

                        var options = defaults[ctrl]['async'];
                        //异步处理
                        (!!options && !pointer) && void function () {
                            //拦截同步提交
                            $.preventDefault(e);
                            var form = ruleArray[ctrl];
                            options.data = $.serialize(form);
                            $.ajax(options).then(function(){
                                options.success();
                            });
                        }();

                    });
                }(ctrl);
            }
        }
    }
    it.prototype.trigger = function (elem, event) {
        var evt = document.createEvent('HTMLEvents');
        // initEvent接受3个参数：
        // 事件类型，是否冒泡，是否阻止浏览器的默认行为
        evt.initEvent(event, true, true);

        elem.dispatchEvent(evt);
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
            success: function (mess, el, ctrl, frNe) {
                mess = $.getMess(mess, 0, ctrl, el, frNe);
                this.trusteeship(1, mess, el);
            },
            error: function (mess, el, ctrl, frNe) {
                mess = $.getMess(mess, 1, ctrl, el, frNe);
                this.trusteeship(0, mess, el);
            },
            info: function () {

            },
            /**
             *
             * 信息处理托管
             * @param {number} type 1=>成功,0=>失败,2=>提示
             * @param content 提示信息
             * @param {object} 操作元素
             *
             */
            trusteeship: function (type, content, el) {
                var control = el.form.getAttribute('it-controller'),
                    option = $.isAll() ? defaults['all'] : defaults[control], node,
                    sibling = it(el).siblings();
                if (sibling === null) $.warn('请添加相邻元素!');
                node = option['messDepth'] === 'sibling' ? sibling : false;
                if (node) {
                    type ? node.className = 'text-success' : node.className = 'text-error';
                    node.innerHTML = content;
                } else {
                    if (option['messDepth'] === 'children') {
                        var child = sibling.children[0];
                        if (child) {
                            type ? child.className = 'text-success' : child.className = 'text-error';
                            child.innerHTML = content;
                        } else {
                            $.warn('请在信息中添加子元素!');
                        }
                    } else {
                        $.warn('请正确填写"messDepth"值!');
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
        //必填项
        'required': function () {
            var args = $.toArray(arguments);
            return $.trim(args[0], args[2]) !== '';
        },
        //最多输入字符长度
        'itMaxlength': function () {
            var args = $.toArray(arguments);
            return $.trim(args[0], args[2]).length<= $.trim(+args[1]);
        },
        //最少输入字符长度
        'itMinlength': function () {
            var args = $.toArray(arguments);
            //0，文本值 1，属性值
            return $.trim(args[0], args[2]).length >= $.trim(+args[1]);
        },
        //最大值
        'itMax':function(){
            var args = $.toArray(arguments),numArgs1,numArgs2;
            numArgs1 = +$.trim(args[0], args[2]);
            numArgs2 = +$.trim(args[1]);
            if($.isNaN(numArgs1) || $.isNaN(numArgs2))return false;
            if(numArgs1<=numArgs2){
                return true;
            } else{
                return false;
            }
        },
        //最大值
        'itMin':function(){
            var args = $.toArray(arguments),numArgs1,numArgs2;
            numArgs1 = +$.trim(args[0], args[2]);
            numArgs2 = +$.trim(args[1]);
            if($.isNaN(numArgs1) || $.isNaN(numArgs2))return false;
            if(numArgs1>=numArgs2){
                return true;
            } else{
                return false;
            }
        },
        //最大字节数
        'itMaxbytes':function(){
            var args = $.toArray(arguments);
            return $.getBytes($.trim(args[0], args[2]))<=$.trim(args[1]);
        },
        //最小字节数
        'itMinbytes':function(){
            var args = $.toArray(arguments);
            return $.getBytes($.trim(args[0], args[2]))>=$.trim(args[1]);
        },
        //纯数字
        'itNumber':function(){
            var args = $.toArray(arguments),
                ctrl = args[2],
                value = $.trim(args[0],ctrl);
            return this.itPattern(value, rNumber, ctrl);
        },
        //email
        'itEmail':function(){
            var args = $.toArray(arguments),
                ctrl = args[2],
                value = $.trim(args[0],ctrl);
            return this.itPattern(value, rEmail, ctrl);
        },
        //网址
        'itWeburl':function(){
            var args = $.toArray(arguments),
                ctrl = args[2],
                value = $.trim(args[0],ctrl);
            return this.itPattern(value, rHttpUrl, ctrl);
        },
        //模式匹配
        'itPattern':function(){
            var args = $.toArray(arguments),
                ctrl = args[2],
                value = $.trim(args[0],ctrl),
                pattern = eval(args[1]);
            return pattern.test(value);
        },
        //密码是否相等对比
        'itPassword':function(){
            var args = $.toArray(arguments),
                ctrl = args[2],
                index = args[4],
                el = args[5],
                mg = args[6],
                passIndexsLen,
                value = $.trim(args[0], ctrl),passCollLen,data,
                addPassColl = function(type, val, ind){
                    data = {value:val,elem:el,index:ind};
                    passCollection[type](data);
                };
                passCollLen = passCollection.length;
                //插入数据
                if(passCollLen<2){
                    //添加
                    if(passCollLen){
                        index>passCollection[0]['index'] ?
                            addPassColl('push', value, index):
                            addPassColl('unshift', value, index);
                    }else{
                        addPassColl('push', value, index);
                    }
                }else{
                    //更新
                    if(passCollection[0]['index']==index){
                        passCollection[0]['value'] = value;
                    }else{
                        passCollection[1]['value'] = value;
                    }
                }

                //数据比较

                if(passCollLen>0){
                    var ind = passCollection[0]['index'] == index;
                    if(passCollection[0]['value'] == passCollection[1]['value']){
                         if(ind){
                             modules[ctrl][passCollection[1]['index']]['status'] = true;
                             $.Observer.itMessages.success(mg, passCollection[1]['elem'], ctrl, 'itPassword');
                         }
                         return true;
                    }else{
                        if(ind){
                            modules[ctrl][passCollection[1]['index']]['status'] = false;
                            $.Observer.itMessages.error(mg, passCollection[1]['elem'], ctrl, 'itPassword');
                            return true;
                        }
                        return false;
                    }
                }else{
                    return true;
                }

        },
        //异步验证字段
        'itAsync': function () {
            var options,
                itPromise,
                args = $.toArray(arguments),
                value = $.trim(args[0]),
                name = args[3],
                control = args[2];
            options = defaults[control]['asyncField'][name] || {};
            itPromise = new Promise(function (resolve, reject) {
                if (typeof options == 'object' && !$.isEmptyObject(options)) {
                    //添加data数据
                    options.data = name + '=' + value;
                    $.ajax(options).then(function(result, error){
                        //defaults对象中，是否有success方法
                        if (options.success && typeof options.success == 'function') {
                            //defaults->success返回结果处理
                            var doneStatus = options.success(result, error);
                            if (typeof doneStatus == 'boolean') {
                                doneStatus ? resolve() : reject();
                            } else {
                                $.warn('success返回类型应为"boolean"!');
                                reject();
                            }
                        } else {
                            $.warn('没有"success"或类型不为"function"!');
                            reject();
                        }
                    },function(){
                        reject();
                    });
                } else {
                    $.warn('请输入正确的"asyncField"字段!');
                    reject();
                }
            });

            return itPromise;

        }

    }


    //////////////
    //   实例化  //
    //////////////

    var $ = new it();

    var $scope = new Scope();

    var originDefaults = {
            //插入信息深度
            'messDepth': 'children',
            //是否进行trim后才进行验证
            'trim':true,
            //默认过滤信息
            'defaultMess': {
                itMaxlength: {
                    0: hook,
                    1: '超过字符最大长度!'
                },
                itMinlength: {
                    0: hook,
                    1: '低于字符最小长度!'
                },
                itMax:{
                    0:hook,
                    1:'输入数字大于限定值或类型不为"number"!'
                },
                itMin:{
                    0:hook,
                    1:'输入数字小于限定值或类型不为"number"!'
                },
                itMaxbytes:{
                    0:hook,
                    1:'输入字节数大于限定值!'
                },
                itMinbytes:{
                    0:hook,
                    1:'输入字节数小于限定值!'
                },
                itPassword:{
                    0:hook,
                    1:'密码要保持一致,请重新输入!'
                },
                itPattern:{
                    0:hook,
                    1:'正则匹配错误!'
                },
                itEmail:{
                    0:hook,
                    1:'请输入正确email地址!'
                },
                itWeburl:{
                    0:hook,
                    1:'请输入正确的网址!'
                },
                itNumber:{
                    0:hook,
                    1:'请输入纯数字!'
                },
                required: {
                    0: hook,
                    1: '该字段不能为空!'
                }
            }
        },
        defaults = {};

    //合并基础配置
    if (typeof options === 'object' && !$.isEmptyObject(options)) {
        for (var prop in options) {
            if ($.hasOwn(options, prop)) {
                defaults[prop] = $.mixIn({}, originDefaults);
                $.mixIn(defaults[prop], options[prop]);
            }
        }
    } else {
        defaults.all = originDefaults;
    }
    //domReady自动运行
    $.ready(function () {
        //初始化获得纯净form-elements
        $.init();
        //绑定事件处理
        $.events();
        //提交操作
        $.submit();
    });

    //返回公共对象
    return {'version': $.version, 'url': 'qingdou.me'}

});


