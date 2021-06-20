"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MongoChecker = (function () {
  function MongoChecker(db, service, timeout) {
    this.db = db;
    this.service = service;
    this.timeout = timeout;
    if (!this.timeout) {
      this.timeout = 4200;
    }
    if (!this.service) {
      this.service = 'mongo';
    }
    this.check = this.check.bind(this);
    this.name = this.name.bind(this);
    this.build = this.build.bind(this);
  }
  MongoChecker.prototype.check = function () {
    var _this = this;
    var obj = {};
    var promise = new Promise(function (resolve, reject) {
      _this.db.command({ ping: 1 }, (function (err, value) {
        if (err || !value) {
          return reject(err);
        }
        else {
          resolve(obj);
        }
      }));
    });
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
