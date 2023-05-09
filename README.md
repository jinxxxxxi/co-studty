# 背景
总所周知，js是同步的，如何实现异步呢。
有几种方法：

1. 回调函数
2. 事件触发
3. 发布订阅模式

但是回掉函数的写法太冗余了，有「回调地狱」，即使换成了更高级的promise， then的调用链长了也会很复杂。  

有没有一种方法，可以让我们直接像写同步的语句一样，来写异步函数呢。generate。  

# generate
js提供的一种写法，能用以同步的方式去执行异步语句。
通过yield语句，注明这个语句是异步的，然后通过next依次执行。
```typescript
var gen2 = function* (a, b) {
    var r1 = yield a + b + 1;
    console.log(r1);
    var r2 = yield a + b + 2;
    console.log(r2);
};

var g2 = gen2(1, 1)
const a = g2.next();// 执行col2，然后停止, 此时a={ value: 3, done: false }
console.log('a', a.value) // 输出 a 3
const b = g2.next(a); // 会把值赋给r1，然后执行col3、col4，此时b={ value: 4, done: false }
console.log('b', b.value) //b 4
const c = g2.next(b) //  // 会把值赋给r2，然后执行col5，此时b={ value: undefined, done: true }
console.log('c', c.value) //输出 c undefined
```

每次都得手动执行next,那么就有问题了：
1、我该在哪个时机去执行next，如果一个函数里边的yield过多，难道我得自己手动一直调用next吗？
2、如过上面的r1和r2有依赖关系，我该在什么时机执行r2？

所以具体到函数层面的问题就是：如何让这个generate函数能够**自动具有逻辑性**的执行?
解决方法有两种：
1. thunkify函数
2. promise函数      
&nbsp;
# thunk函数方案
## 什么是thunk函数？
[https://www.ruanyifeng.com/blog/2015/05/thunk.html](https://www.ruanyifeng.com/blog/2015/05/thunk.html)

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
 

## thunk npm包

生产环境的转换器，建议使用 Thunkify 模块。

[thunkify github](https://github.com/tj/node-thunkify)

&nbsp;
&nbsp;
## 通过thunkify将generate自动化
对于readFileThunk函数来说，能手接受一个callback参数，

### thunk函数能干什么
我们可以将readFile改造成thunk函数，那每次在执行next的时候，都能通过value属性拿到一个readFileThunk, 比如下面的r1.value就是一个readFileThunk，接受一个callback参数。
那么我们就能在next函数里面拿到`1.txt`文件的内容，并且有了一个时机去执行后续的`yield`。
```typescript
var thunkify = require('thunkify');
var readFile = thunkify(fs.readFile);
var r1 = yield readFile('./text/1.txt', 'utf-8');

```

总结，thunk函数能接受一个回调函数作为参数，因此我们能在这个回掉函数里面**插入后续yield执行的逻辑，**因此就能链式的一直调用


&nbsp;
&nbsp;
### thunk改造readFile示例
```typescript
var fs = require('fs');
var thunkify = require('thunkify');
var readFile = thunkify(fs.readFile);

var gen = function* () {
    var r1 = yield readFile('./text/1.txt', 'utf-8'); // 接受cb作为参数
    console.log(r1);
    var r2 = yield readFile('./text/2.txt', 'utf-8');
    console.log(r2);
};

var g = gen()
const r1 = g.next(); //  执行r1, r1的value是一个readFile的thunk函数 接受cb作为参数
r1.value(function(err,data){ // 这里的data是r1中readFile的结果
  const r2 = g.next(data); // 可以将结果赋值给r1，让下一行中的console语句拿到值
  r2.value(function(err,data){ //重复next
    g.next(data);
  })
})
```

可以看出上面的逻辑就是重复的在返回的thunk中，将上一次的结果传入next；然后直到函数结束。 可以将上述函数包装成`run(gen)`的形式，直接自动执行整个gen函数；

```typescript
function run(gen){
  function next(err,data){
    if(err){
      throw new Error(err)
    }
    if(data.done) return;
    const g = gen.next(data)
    g.value(next)
  }
  next()
}

```

### run函数和async/await的关系
都知道async，await就是语法糖，

**async就是代替了*，同时多了4个特性：**

1. async内置了执行器

上面读取文件的代码，用async写的话就是:
```typescript
const asyncReadFile = function() {
    const file1 = await readFile('./text/1.txt', 'utf-8'); // 接受cb作为参数
    const file2 = yield readFile('./text/2.txt', 'utf-8');
    console.log(file1);
    console.log(file1);
};

asyncReadFile()
```
可以看到，写法上就是直接async替换*, await替换yield， 但是问题是**asyncReadFile**可以直接执行，但是上面的`gen`需要一步步的next（除非调用run）。 所以`asyncReadFile()`其实等同于 `run(gen)`。 也就是async内置了run函数。

2. async和await，比起星号和yield，语义更清楚了。async表示函数里有异步操作，await表示紧跟在后面的表达式需要等待结果。
3. co模块约定，yield命令后面只能是 Thunk 函数或 Promise 对象，而async函数的await命令后面，可以是 Promise 对象和原始类型的值（数值、字符串和布尔值，但这时会自动转成立即 resolved 的 Promise 对象）。

后面我们会讲如何用promise实现await

4. 返回值是 Promise。

async函数的返回值是 Promise 对象，这比 Generator 函数的返回值是 Iterator 对象方便多了。你可以用then方法指定下一步的操作。
进一步说，async函数完全可以看作多个异步操作，包装成的一个 Promise 对象，而await命令就是内部then命令的语法糖。

**await就是yield的语法糖。**

&nbsp;
&nbsp;
## 通过Promise实现
其实本质就是将thunk函数替换成了promise，还是在promise回调里面去执行next，实现方式在
[https://github.com/jinxxxxxi/co-studty/tree/main/withPromise](https://github.com/jinxxxxxi/co-studty/tree/main/withPromise)
就不过多赘述了
