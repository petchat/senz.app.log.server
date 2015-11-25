/**
 * Created by zhanghengyang on 15/7/24.
 */

async.parallel([
    function (callback) {
      player.save(callback);
    },
    function (callback) {
      story.save(callback);
    }
  ],
  function (errs, results) {
    if (errs) {
      async.each(results, rollback, function () {
        console.log('Rollback done.');
      });
    } else {
      console.log('Done.');
    }
  });

function rollback (doc, callback) {
  doc.remove(function (err, doc) {
    callback();
  });
}
