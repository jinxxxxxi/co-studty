var fs = require('fs');
var readFile = function (fileName) {
    return new Promise((resolve, reject) => {
        fs.readFile(fileName, 'utf-8', function (err, data) {
            if (err) { reject(err) }
            resolve(data)
        })
    })
};
/** 对于无限次的yield，支持自动调用*/

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

    return new Promise((resolve, reject) => {
        function onFulfilled(data) {
            const gCopy = g.next(data);
            next(gCopy)
        }

        function next(res) {
            console.log('res', res)
            if (res.done) return;
            const promise = res.value;
            promise && promise.then(onFulfilled)
        }
        onFulfilled()
    })



}

coPromise(gen, 'zhangjing')

