var fs = require('fs');
var readFile = function (fileName) {
    return new Promise((resolve, reject) => {
        fs.readFile(fileName, 'utf-8', function (err, data) {
            if (err) { reject(err) }
            resolve(data)
        })
    })
};


/** 手动执行promise*/

var gen = function* () {
    var f1 = yield readFile('./text/1.txt', 'utf-8');
    console.log('f1', f1)
    var f2 = yield readFile('./text/2.txt', 'utf-8');
    console.log('f2', f2)
};

const g = gen();
const r1 = g.next();
r1.value.then(data => {
    const r2 = g.next(data);
    return r2.value
}).then(data => {
    g.next(data)
})
