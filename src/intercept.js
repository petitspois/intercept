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

    //常用正则表达式
    //匹配数字
    var rNumber = /^\d+$/g,

        //中文字符
        rChinese = /^[\u4e00-\u9fa5]+$/,

        //email
        rEmail = /[\w!#$%&'*+/=?^_`{|}~-]+(?:\.[\w!#$%&'*+/=?^_`{|}~-]+)*@(?:[\w](?:[\w-]*[\w])?\.)+[\w](?:[\w-]*[\w])?/,

        //网址url
        rHttpUrl = /[a-zA-z]+:\/\/[^\s]*/,

        //qq号码
        rQQ = /^[1-9][0-9]{4,}$/,

        //国内电话
        rPhone = /^((0\d{2,3})-)(\d{7,8})(-(\d{3,}))?$/,

        /**
         * @descrition:手机号码段规则
         * 13段：130、131、132、133、134、135、136、137、138、139
         * 14段：145、147
         * 15段：150、151、152、153、155、156、157、158、159
         * 17段：170、176、177、178
         * 18段：180、181、182、183、184、185、186、187、188、189
         *
         */

        rTel = /^(13[0-9]|14[57]|15[012356789]|17[0678]|18[0-9])\d{8}$/,

        //日期（YYYY/MM/DD、YYYY/M/D、YYYY-MM-DD、YYYY-M-D）
        rDate = /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$|^(?:(?:(?:0?[13578]|1[02])(\/|-)31)|(?:(?:0?[1,3-9]|1[0-2])(\/|-)(?:29|30)))(\/|-)(?:[1-9]\d\d\d|\d[1-9]\d\d|\d\d[1-9]\d|\d\d\d[1-9])$|^(?:(?:0?[1-9]|1[0-2])(\/|-)(?:0?[1-9]|1\d|2[0-8]))(\/|-)(?:[1-9]\d\d\d|\d[1-9]\d\d|\d\d[1-9]\d|\d\d\d[1-9])$|^(0?2(\/|-)29)(\/|-)(?:(?:0[48]00|[13579][26]00|[2468][048]00)|(?:\d\d)?(?:0[48]|[2468][048]|[13579][26]))$/,

        //身份证
        rIdentity = /^(\d{6})(\d{4})(\d{2})(\d{2})(\d{3})([0-9]|X|x)$/,

        //匹配整数
        rInteger = /^-?[1-9]\d*$/;




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
            itA.length > 0 && (itA[0]['nodeName'] == 'it-messages' ? itA.splice(1,0,'required'):itA.unshift('required'));
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
                modules[ctrl]
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
                    loop : while (el = controller[prop]['elem'][local = i++]) {
                        //需要验证的字段，绑定事件
                        if (!$.getItAttr(el.attributes).length)break loop;
                        data = {'elem': el, 'status': false ,'msg':''};
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
                                        var me = this,equal = false;
                                        $scope[p + '$' + me.name] = me.value;
                                        equal = $scope.$digest();

                                        try{

                                            //当验证值相等与”prompts“为true时
                                            if(equal && (defaults[prop]['prompts'] || defaults['all']['prompts'])){
                                                var msg = modules[prop][local]['msg'],
                                                    sibling = it(me).siblings();
                                                console.log(msg)
                                                if(defaults[prop]['messDepth'] === 'children'){
                                                    msg.s ? sibling.children[0].className = 'text-error':
                                                        sibling.children[0].className = 'text-success';
                                                    sibling.children[0].innerHTML = msg.v;
                                                }else{
                                                    msg.s ? sibling.className = 'text-error' : sibling.className = 'text-success';
                                                    sibling.innerHTML = msg.v;
                                                }
                                            }

                                        }catch(e){}

                                    });

                                    //提示信息
                                    try{
                                        if(defaults[prop]['prompts'] || defaults['all']['prompts']){
                                            it(el).on('mousedown', function () {
                                                $.Observer.itMessages.info(this, prop, local);
                                            });
                                        }
                                    }catch(e){}

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
                    statusAndMess = function (status, async) {

                        //同步异步信息处理
                        mg = async ? '异步字段验证成功!|异步字段验证失败!' : mg;

                        typeof function (ind) {

                            //改变验证状态
                            modules[control][ind]['status'] = status = status!==undefined ? status : true;

                            //执行媒体操作
                            status?
                                $.Observer.itMessages.success(mg, elem, control, filterName, ind):
                                $.Observer.itMessages.error(mg, elem, control, filterName, ind);

                        }(index);

                    }

                    //如果存在异步字段
                    if (isAsync) {
                        itasync = $scope.$filter.itAsync(newValue, (node.value || node), control, name);
                        itasync.then(function () {
                            statusAndMess(true, true);
                        }, function () {
                            statusAndMess(false, true);
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

                    typeof function (ind) {

                        //改变验证状态
                        modules[control][ind]['status'] = false;

                        //执行媒体操作
                        $.Observer.itMessages.error(mg, elem, control, filterName, ind);

                    }(index);

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
                        //拦截验证失败时
                        pointer && $.preventDefault(e);

                        var options = defaults[ctrl] && defaults[ctrl]['async'];
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
    it.prototype.trigger = function (elem, type) {
        var evt;
        if(document.createEvent){
            evt = document.createEvent('HTMLEvents');
            evt.initEvent(type, true, true);
            elem.dispatchEvent(evt);
        }else{
            evt = document.createEventObject();
            evt.eventType = 'on' + type;
            elem.fireEvent(evt.eventType, evt);
        }
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
            success: function (mess, el, ctrl, frNe, ind) {
                mess = $.getMess(mess, 0, ctrl, el, frNe);
                typeof ind !='undefined' && (modules[ctrl][ind]['msg'] = {s:0, v:mess});
                this.trusteeship(1, mess, el, ctrl);
            },
            error: function (mess, el, ctrl, frNe, ind) {
                mess = $.getMess(mess, 1, ctrl, el, frNe);
                typeof ind !='undefined' && (modules[ctrl][ind]['msg'] = {s:1, v:mess});
                this.trusteeship(0, mess, el, ctrl);
            },
            info: function (el, ctrl, ind) {
                var msg;

                try{
                    msg = el.getAttribute('it-messages').split('|');
                }catch (e){
                    //配置项是否设置信息
                    try{
                        msg = defaults[ctrl]['messContent'][el.name];
                        !msg && it.it();
                    }catch(e){
                        throw new Error('prompts为true时，请在dom上设置"it-messages"或配置项设置"messContent"!');
                    }
                }

                if(!msg[2]){
                    throw new Error('请为"it-messages"或配置项,设置提示信息!');
                }

                this.trusteeship(2, msg[2], el, ctrl);

            },
            /**
             *
             * 信息处理托管
             * @param {number} type 1=>成功,0=>失败,2=>提示
             * @param content 提示信息
             * @param {object} 操作元素
             *
             */
            trusteeship: function (type, content, el, control) {
                var option = defaults[control] || defaults['all'], node,
                    sibling = it(el).siblings();
                if (sibling === null) $.warn('请添加相邻元素!');
                node = option['messDepth'] === 'sibling' ? sibling : false;
                if (node) {
                    switch(type){
                        case 0:
                            node.className = 'text-error'
                            break;
                        case 1:
                            node.className = 'text-success'
                            break;
                        default:
                            node.className = 'text-info'
                    }
                    node.innerHTML = content;
                } else {
                    if (option['messDepth'] === 'children'){
                        var child = sibling.children[0];
                        if (child) {
                            switch(type){
                                case 0:
                                    child.className = 'text-error'
                                    break;
                                case 1:
                                    child.className = 'text-success'
                                    break;
                                default:
                                    child.className = 'text-info'
                            }
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
        var dirty, once = false,equal = false;
        do {
            var i = 0, watcher;
            dirty = false;
            while (watcher = this.$$watchers[i++]) {
                var newValue = watcher.watchExp(),
                    oldValue = watcher.last;
                if(oldValue !== newValue) {
                    watcher.listener(newValue);
                    dirty = true;
                    !once && (equal = false);
                     once = true;
                    watcher.last = newValue;
                }else{
                    !once && (equal = true);
                     once = true;
                }
            }
        } while (dirty);

        return equal;
    }

    Scope.prototype.$filter = {
        //- arguments 0,文本值 1,属性值
        //必填项
        'required': function () {
            var args = $.toArray(arguments);
            return $.trim(args[0], args[2]) !== '';
        },
        //最多输入字符长度
        'itMaxlength': function () {
            var args = $.toArray(arguments);
            return $.trim(args[0], args[2]).length<= +args[1];
        },
        //最少输入字符长度
        'itMinlength': function () {
            var args = $.toArray(arguments);
            //0，文本值 1，属性值
            return $.trim(args[0], args[2]).length >= +args[1];
        },
        //最大值
        'itMax':function(){
            var args = $.toArray(arguments),numArgs1,numArgs2;
            numArgs1 = +$.trim(args[0], args[2]);
            numArgs2 = +args[1];
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
            numArgs2 = +args[1];
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
            return $.getBytes($.trim(args[0], args[2]))<=args[1];
        },
        //最小字节数
        'itMinbytes':function(){
            var args = $.toArray(arguments);
            return $.getBytes($.trim(args[0], args[2]))>=args[1];
        },
        //纯数字
        'itNumber':function(){
            var args = $.toArray(arguments),
                ctrl = args[2],
                value = $.trim(args[0],ctrl);
            return this.itPattern(value, rNumber, ctrl);
        },
        //中文字符
        'itChinese':function(){
            var args = $.toArray(arguments),
                ctrl = args[2],
                value = $.trim(args[0],ctrl);
            return this.itPattern(value, rChinese, ctrl);
        },
        //整数
        'itInteger':function(){
            var args = $.toArray(arguments),
                ctrl = args[2],
                value = $.trim(args[0],ctrl);
            return this.itPattern(value, rInteger, ctrl);
        },
        //QQ
        'itQq':function(){
            var args = $.toArray(arguments),
                ctrl = args[2],
                value = $.trim(args[0],ctrl);
            return this.itPattern(value, rQQ, ctrl);
        },
        //phone
        'itPhone':function(){
            var args = $.toArray(arguments),
                ctrl = args[2],
                value = $.trim(args[0],ctrl);
            return this.itPattern(value, rPhone, ctrl);
        },
        //tel
        'itTel':function(){
            var args = $.toArray(arguments),
                ctrl = args[2],
                value = $.trim(args[0],ctrl);
            return this.itPattern(value, rTel, ctrl);
        },
        //email
        'itEmail':function(){
            var args = $.toArray(arguments),
                ctrl = args[2],
                value = $.trim(args[0],ctrl);
            return this.itPattern(value, rEmail, ctrl);
        },
        //date
        'itDate':function(){
            var args = $.toArray(arguments),
                ctrl = args[2],
                value = $.trim(args[0],ctrl);
            return this.itPattern(value, rDate, ctrl);
        },
        //身份证
        'itIdentity':function(){
            var args = $.toArray(arguments),
                ctrl = args[2],
                value = $.trim(args[0],ctrl);
            return this.itPattern(value, rIdentity, ctrl);
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

            try{
                options = defaults[control]['asyncField'][name] || {};
            }catch(e){
                throw new Error('请设置"asyncField"!');
            }
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
            //是否显示提示信息
            'prompts':false,
            //异步提交
            'async':false,
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
                itQq:{
                    0:hook,
                    1:'请输入正确的qq号码!'
                },
                itChinese:{
                    0:hook,
                    1:'请输入正确中文字符!'
                },
                itPhone:{
                    0:hook,
                    1:'请输入正确电话号码!'
                },
                itTel:{
                    0:hook,
                    1:'请输入正确手机号码!'
                },
                itDate:{
                    0:hook,
                    1:'请输入正确日期格式!'
                },
                itIdentity:{
                    0:hook,
                    1:'请输入正确身份证件号!'
                },
                itInteger:{
                    0:hook,
                    1:'请输入整数!'
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


