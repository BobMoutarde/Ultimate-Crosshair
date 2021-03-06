/* */ 
(function(process) {
  var lockFile = require("../lockfile");
  var touch = require("touch");
  var test = require("tap").test;
  var fs = require("fs");
  var RETRYWAIT = 100;
  var WAIT = 100;
  var RETRIES = 2;
  var EXPECTTIME = (RETRYWAIT * RETRIES) + (WAIT * (RETRIES + 1));
  var TOOLONG = EXPECTTIME * 1.1;
  test('setup', function(t) {
    touch.sync('file.lock');
    t.end();
  });
  var pollPeriods = [10, 100, 10000];
  pollPeriods.forEach(function(pp) {
    test('retry+wait, poll=' + pp, function(t) {
      var ended = false;
      var timer = setTimeout(function() {
        t.fail('taking too long!');
        ended = true;
        t.end();
      }, 2000);
      timer.unref();
      var start = Date.now();
      lockFile.lock('file.lock', {
        wait: WAIT,
        retries: RETRIES,
        retryWait: RETRYWAIT,
        pollPeriod: pp
      }, function(er) {
        if (ended)
          return;
        var time = Date.now() - start;
        console.error('t=%d', time);
        t.ok(time >= EXPECTTIME, 'should take at least ' + EXPECTTIME);
        t.ok(time < TOOLONG, 'should take less than ' + TOOLONG);
        clearTimeout(timer);
        t.end();
      });
    });
  });
  test('cleanup', function(t) {
    fs.unlinkSync('file.lock');
    t.end();
    setTimeout(function() {
      process.exit(1);
    }, 500).unref();
  });
})(require("process"));
