module.exports = (() => {
    var LOG_PREFIX = new Date().getDate() + '/' + (new Date().getMonth()+1) + '/' + new Date().getFullYear() + ' ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds();
    var log = console.log;
    console.log = function () {
        var args = Array.from(arguments);
        args.unshift(LOG_PREFIX + " => ");
        log.apply(console, args);
    }
})()
