var fs = require('fs');
var thunkify = require('thunkify');
var readFile = thunkify(fs.readFile);


var gen = function* () {
    var f1 = yield readFile('./text/1.txt', 'utf-8');
    var f2 = yield readFile('./text/2.txt', 'utf-8');
    console.log('f1', f1)
    console.log('f2', f2)
};

function run(gen) {
    var g = gen();

    function next(err, data) {
        if (err) {
            throw new Error('error:', err);
        }
        var gen = g.next(data)
        if (gen.done) return;
        gen.value(next) // 继续执行r2，并且将结果传给上一个yeild
    }

    next()
}

run(gen)