

// fs 模块的 readFile 方法是一个多参数函数，两个参数分别为文件名和回调函数。
//经过转换器处理，它变成了一个单参数函数，只接受回调函数作为参数 
// 正常版本的readFile（多参数版本）
fs.readFile(fileName, callback);

// Thunk版本的readFile（单参数版本）
var readFileThunk = Thunk(fileName);
readFileThunk(callback);

var Thunk = function (fileName) {
    return function (callback) {
        return fs.readFile(fileName, callback);
    };
};
