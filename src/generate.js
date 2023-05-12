var fs = require('fs');
var thunkify = require('thunkify');
var readFile = thunkify(fs.readFile);

var gen = function* () {
    var r1 = yield readFile('./text/1.txt', 'utf-8'); // 接受cb作为参数
    console.log(r1);
    var r2 = yield readFile('./text/2.txt', 'utf-8');
    console.log(r2);
};

var g = gen();
var r1 = g.next(); //  执行r1, r1的value是一个readFile的thunk函数 接受cb作为参数
r1.value(function (err, data) { // 这里的data是r1中readFile的结果
    if (err) throw err;
    var r2 = g.next(data); // 可以将结果赋值给r1，让下一行中的console语句拿到值
    r2.value(function (err, data) { //开始递归
        if (err) throw err;
        g.next(data);
    });
});

// g.next()
// g.next()


// run(gen);

var gen2 = function* (a, b) {
    var r1 = yield a + b + 1;
    console.log(r1);
    var r2 = yield a + b + 2;
    console.log(r2);
};

var g2 = gen2(1, 1)
const a = g2.next();
console.log('a', a)
const b = g2.next(a);
console.log('b', b)
const c = g2.next(b)
console.log('c', c)

