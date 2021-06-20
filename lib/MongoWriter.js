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
var mongo_1 = require("./mongo");
var MongoLoader_1 = require("./MongoLoader");
function getCollectionName(model, collectionName) {
  var n = (collectionName ? collectionName : (model.collection ? model.collection : (model.source ? model.source : model.name)));
  return n;
}
exports.getCollectionName = getCollectionName;
var MongoWriter = (function (_super) {
  __extends(MongoWriter, _super);
  function MongoWriter(db, model) {
    var _this = _super.call(this, db.collection(getCollectionName(model)), model) || this;
    _this.insert = _this.insert.bind(_this);
    _this.update = _this.update.bind(_this);
    _this.patch = _this.patch.bind(_this);
    _this.save = _this.save.bind(_this);
    _this.delete = _this.delete.bind(_this);
    return _this;
  }
  MongoWriter.prototype.insert = function (obj) {
    return mongo_1.insert(this.collection, obj, this.idName);
  };
  MongoWriter.prototype.update = function (obj) {
    return mongo_1.update(this.collection, obj, this.idName);
  };
  MongoWriter.prototype.patch = function (obj) {
    return mongo_1.patch(this.collection, obj, this.idName);
  };
  MongoWriter.prototype.save = function (obj) {
    return mongo_1.upsert(this.collection, obj, this.idName);
  };
  MongoWriter.prototype.delete = function (id) {
    return mongo_1.deleteById(this.collection, id);
  };
  return MongoWriter;
}(MongoLoader_1.MongoLoader));
exports.MongoWriter = MongoWriter;
