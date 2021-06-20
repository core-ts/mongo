"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var bson_1 = require("bson");
var metadata_1 = require("./metadata");
var mongo_1 = require("./mongo");
var MongoLoader = (function () {
  function MongoLoader(collection, model) {
    this.collection = collection;
    if (typeof model === 'string') {
      this.idName = model;
    }
    else {
      var meta = metadata_1.build(model);
      this.idName = meta.id;
      this.idObjectId = meta.objectId;
      this.map = meta.map;
    }
    this.id = this.id.bind(this);
    this.metadata = this.metadata.bind(this);
    this.all = this.all.bind(this);
    this.load = this.load.bind(this);
    this.exist = this.exist.bind(this);
  }
  MongoLoader.prototype.id = function () {
    return this.idName;
  };
  MongoLoader.prototype.metadata = function () {
    return this.model;
  };
  MongoLoader.prototype.all = function () {
    return mongo_1.findWithMap(this.collection, {}, this.idName, this.map);
  };
  MongoLoader.prototype.load = function (id) {
    var query = { _id: (this.idObjectId ? new bson_1.ObjectId('' + id) : '' + id) };
    return mongo_1.findOne(this.collection, query, this.idName, this.map);
  };
  MongoLoader.prototype.exist = function (id) {
    var query = { _id: (this.idObjectId ? new bson_1.ObjectId('' + id) : '' + id) };
    return mongo_1.count(this.collection, query).then(function (c) { return c > 0; });
  };
  return MongoLoader;
}());
exports.MongoLoader = MongoLoader;
