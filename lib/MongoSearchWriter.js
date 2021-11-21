"use strict";
var __extends = (this && this.__extends) || (function () {
  var extendStatics = function (d, b) {
    extendStatics = Object.setPrototypeOf ||
      ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
      function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
  };
  return function (d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var MongoWriter_1 = require("./MongoWriter");
var MongoSearchWriter = (function (_super) {
  __extends(MongoSearchWriter, _super);
  function MongoSearchWriter(find, db, collectionName, attributes, toBson, fromBson) {
    var _this = _super.call(this, db, collectionName, attributes, toBson, fromBson) || this;
    _this.find = find;
    _this.db = db;
    _this.search = _this.search.bind(_this);
    return _this;
  }
  MongoSearchWriter.prototype.search = function (s, limit, offset, fields) {
    return this.find(s, limit, offset, fields);
  };
  return MongoSearchWriter;
}(MongoWriter_1.MongoWriter));
exports.MongoSearchWriter = MongoSearchWriter;
