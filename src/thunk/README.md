# thunk函数

## 什么是thunk函数？ 
https://www.ruanyifeng.com/blog/2015/05/thunk.html

在 JavaScript 语言中，Thunk 函数替换的不是表达式，而是多参数函数，将其替换成单参数的版本，且只接受回调函数作为参数

对于任何函数，只要参数有回调函数，就能写成 Thunk 函数的形式。

下面是一个简单的转换器
```javascript
var Thunk = function(fn){
  return function (){
    var args = Array.prototype.slice.call(arguments);
    return function (callback){
      args.push(callback);
      return fn.apply(this, args);
    }
  };
};
```

使用上面的代码，即可将readFile进行thunk改造：
```javascript
var readFile = Thunk(readFile);
readFile(fileName)(callback)
```

&nbsp;
&nbsp;
## npm包
生产环境的转换器，建议使用 Thunkify 模块。

[thunkify github]( https://github.com/tj/node-thunkify)

