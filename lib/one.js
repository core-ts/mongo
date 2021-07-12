"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongo_1 = require("./mongo");
var MongoInserter = (function () {
  function MongoInserter(collection, id, map) {
    this.collection = collection;
    this.id = id;
    this.map = map;
    this.write = this.write.bind(this);
  }
  MongoInserter.prototype.write = function (obj) {
    return mongo_1.insert(this.collection, obj, this.id, false, this.map);
  };
  return MongoInserter;
}());
exports.MongoInserter = MongoInserter;
var MongoUpdater = (function () {
  function MongoUpdater(collection, id, map) {
    this.collection = collection;
    this.id = id;
    this.map = map;
    this.write = this.write.bind(this);
  }
  MongoUpdater.prototype.write = function (obj) {
    return mongo_1.update(this.collection, obj, this.id, this.map);
  };
  return MongoUpdater;
}());
exports.MongoUpdater = MongoUpdater;
var MongoPatcher = (function () {
  function MongoPatcher(collection, id, map) {
    this.collection = collection;
    this.id = id;
    this.map = map;
    this.write = this.write.bind(this);
  }
  MongoPatcher.prototype.write = function (obj) {
    return mongo_1.patch(this.collection, obj, this.id, this.map);
  };
  return MongoPatcher;
}());
exports.MongoPatcher = MongoPatcher;
var MongoUpserter = (function () {
  function MongoUpserter(collection, id, map) {
    this.collection = collection;
    this.id = id;
    this.map = map;
    this.write = this.write.bind(this);
  }
  MongoUpserter.prototype.write = function (obj) {
    return mongo_1.upsert(this.collection, obj, this.id, this.map);
  };
  return MongoUpserter;
}());
exports.MongoUpserter = MongoUpserter;
