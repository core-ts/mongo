"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongo_1 = require("./mongo");
var MongoBatchInserter = (function () {
  function MongoBatchInserter(collection, id, map) {
    this.collection = collection;
    this.id = id;
    this.map = map;
    this.write = this.write.bind(this);
  }
  MongoBatchInserter.prototype.write = function (list) {
    var _this = this;
    if (this.map) {
      list = list.map(function (o) { return _this.map(o); });
    }
    return mongo_1.insertMany(this.collection, list, this.id);
  };
  return MongoBatchInserter;
}());
exports.MongoBatchInserter = MongoBatchInserter;
var MongoBatchUpdater = (function () {
  function MongoBatchUpdater(collection, id, map) {
    this.collection = collection;
    this.id = id;
    this.map = map;
    this.write = this.write.bind(this);
  }
  MongoBatchUpdater.prototype.write = function (list) {
    var _this = this;
    if (this.map) {
      list = list.map(function (o) { return _this.map(o); });
    }
    return mongo_1.updateMany(this.collection, list, this.id);
  };
  return MongoBatchUpdater;
}());
exports.MongoBatchUpdater = MongoBatchUpdater;
var MongoBatchWriter = (function () {
  function MongoBatchWriter(collection, id, map) {
    this.collection = collection;
    this.id = id;
    this.map = map;
    this.write = this.write.bind(this);
  }
  MongoBatchWriter.prototype.write = function (list) {
    var _this = this;
    if (this.map) {
      list = list.map(function (o) { return _this.map(o); });
    }
    return mongo_1.upsertMany(this.collection, list, this.id);
  };
  return MongoBatchWriter;
}());
exports.MongoBatchWriter = MongoBatchWriter;
