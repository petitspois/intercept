/*! bd.js 0.0.1 */

(function (name, factory) {
    if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
        module.exports = factory();
    } else {
        this[name] = factory;
    }
})('_bd', function (node, options) {

    var defaults = {
        username : '|',
    };

    var nodes = $(node).find('input[bd-rule]'),
        nodesArr = [];

    $.each(nodes,function(k,v){
        $(this).on('blur',function(){
            console.log($(this).attr('bd-rule'))
        });
    });

    console.log(nodesArr)




//    $.bd = function(options){
//        console.log(this[0].nodeName)
//    }


});


