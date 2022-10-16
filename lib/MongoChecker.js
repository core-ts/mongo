"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MongoChecker = (function () {
  function MongoChecker(db, service, timeout) {
    this.db = db;
    this.timeout = (timeout && timeout > 0 ? timeout : 4200);
    this.service = (service && service.length > 0 ? service : 'mongo');
    this.check = this.check.bind(this);
    this.name = this.name.bind(this);
    this.build = this.build.bind(this);
  }
  MongoChecker.prototype.check = function () {
    var promise = this.db.command({ ping: 1 });
    if (this.timeout > 0) {
      return promiseTimeOut(this.timeout, promise);
    }
    else {
      return promise;
    }
  };
  MongoChecker.prototype.name = function () {
    return this.service;
  };
  MongoChecker.prototype.build = function (data, err) {
    if (err) {
      if (!data) {
        data = {};
      }
      data['error'] = err;
    }
    return data;
  };
  return MongoChecker;
}());
exports.MongoChecker = MongoChecker;
function promiseTimeOut(timeoutInMilliseconds, promise) {
  return Promise.race([
    promise,
    new Promise(function (resolve, reject) {
      setTimeout(function () {
        reject("Timed out in: " + timeoutInMilliseconds + " milliseconds!");
      }, timeoutInMilliseconds);
    })
  ]);
}
