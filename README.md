intercept.js 
=============
```
超简单表单验证解决方案
```

####优势
* **操作简单** : 只须在dom中添加属性即可
* **异步支持** : 支持异步提交表单，以及异步字段
* **依赖关系** : 不需要任何依赖，原生javascript 
* **兼容性能** : ie8+,以及其他高级浏览器（暂时不支持ie6,7）
* **多表单** : 支持多表单验证

####快速入门
只需要引用intercept.js,调用$it即可
``` html
 <script src="intercept.js" type="text/javascript"></script>
 <script type="text/javascript">
    $it();
 </script>
```
####简单例子
``` html
<form name="form1" it-controller="top">
     <input type="text" it-messages="成功信息|错误信息|提示信息" it-maxlength="8" it-async required />
     <input type="submit" value="提交" />
</form>
```
####配置项
``` javascript
$it({
     'top': {

          //提示信息，层级深度（为当先表单元素的下一个同胞元素）
          //'sibling' => 表示同胞内插入信息, 
          //'children' => 表示同胞的子元素内插入信息|默认值|
          messDepth: 'sibling',

          //提示信息具体内容 { number } 0=>成功时提示信息, 1=>失败时提示信息, 2=>提醒信息
          messContent : {
              username: {
                  0: '输入正确!!!',
                  1: '你输入的手机号码格式有误，需为 11 位数字格式',
                  2: '请输入11位手机号码'
              }
          },

          //字段异步操作
          asyncField:{
              'username':{
                  url:'http://localhost:63342/intercept/tests/index.html',
                  type:'post',
                  'success':function(result){
                      return true;
                  }
              }
          },

          //异步提交表单
          async:{
              'url':'http://localhost:63342/intercept/tests/index.html',
              'type':'post'
          },

          //去前后空格，|默认true|
          trim:true,

          //是否显示提示信息
          prompts:true
       },
      'all': {
           messDepth: 'children'
      }
});
```
####验证属性
<pre>
    ('x')  不需要给值的属性，例： it-async
    ('d')  需要给值的属性, 例： it-maxlength='6'
</pre>
* **required** : 必填字段 --- ('x')
* **it-async** : 需要异步验证字段（配置项必须有asyncField，并且以该字段name为名字的一个配置）--- ('x')
* **it-maxlength** : 最多输入字符长度 --- ('d')
* **it-minlength** : 最少输入字符长度 --- ('d')
* **it-max** : 最大值（该项为数字的最大值）--- ('d')
* **it-min** : 最小值（该项为数字的最小值）--- ('d')
* **it-maxbytes** : 最大字节数 --- ('d')
* **it-minbytes** : 最小字节数 --- ('d')
* **it-password** : 验证前一个"it-password"的值与当前值是否相等 --- ('x')
* **it-pattern** : 匹配一个正则表达式 --- ('d')
* **it-email** : 匹配一个email地址 --- ('x')
* **it-weburl** : 匹配一个网址 --- ('x')
* **it-chinese** : 匹配中文字符 --- ('x')
* **it-phone** : 匹配国内电话 --- ('x')
* **it-tel** : 匹配国内手机号 --- ('x')
* **it-qq** : 匹配qq号码 --- ('x')
* **it-date** : 匹配日期(YYYY/MM/DD、YYYY/M/D、YYYY-MM-DD、YYYY-M-D) --- ('x')
* **it-identity** : 匹配身份证件号 --- ('x')
* **it-integer** : 匹配整数 --- ('x')
* **it-messages** : 信息字段等同与配置项的messContent，例： 成功信息|错误信息|提示信息 --- ('d')

####注意事项

####兼容性
* ![ie10](http://ydrimg.oss-cn-hangzhou.aliyuncs.com/20140919111504913271952205.png) IE8+
* ![chrome](http://ydrimg.oss-cn-hangzhou.aliyuncs.com/20140919111534857215164833.png) chrome latest
* ![firefox](http://ydrimg.oss-cn-hangzhou.aliyuncs.com/20140919111545251609050667.png) firefox latest
* ![safari](http://ydrimg.oss-cn-hangzhou.aliyuncs.com/20140919191953088445180368.png) safari latest
