var fs = require('fs');
var readFile = function (fileName) {
    return new Promise((resolve, reject) => {
        fs.readFile(fileName, 'utf-8', function (err, data) {
            if (err) { reject(err) }
            resolve(data)
        })
    })
};
/** 支持传入多个参数，并手动执行promise,*/

var gen = function* (suffix = '') {
    var f1 = yield readFile('./text/1.txt', 'utf-8');
    console.log('f1', f1, suffix)
    var f2 = yield readFile('./text/2.txt', 'utf-8');
    console.log('f2', f2, suffix)
};


function coPromise(gen) {
    const ctx = this;
    const args = Array.from(arguments).slice(1)
    console.log('args', args)
    const g = gen.apply(ctx, args);
    const r1 = g.next();
    r1.value.then(data => {
        const r2 = g.next(data);
        r2.value.then(data => {
            g.next(data)
        })
    })
}

coPromise(gen, 'zhangjing');

