module.exports = function promiseTimeout(ms, promise) {
  return new Promise(function (resolve, reject) {
    var timeoutId = setTimeout(function promiseTimeout() {
      reject(new Error('Timeout after ' + ms + 'ms'));
    }, ms);

    var cancelTimeoutThen = function cancelTimeoutThenFactory(fn) {
      return function cancelTimeoutThen() {
        clearTimeout(timeoutId);
        fn.apply(undefined, arguments);
      };
    };

    return  promise.then(cancelTimeoutThen(resolve), cancelTimeoutThen(reject));
  });
};
