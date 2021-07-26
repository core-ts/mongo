"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var bson_1 = require("bson");
var metadata_1 = require("./metadata");
var mongo_1 = require("./mongo");
var MongoLoader = (function () {
  function MongoLoader(db, collectionName, attributes, fromBson) {
    this.fromBson = fromBson;
    if (typeof attributes === 'string') {
      this.id = attributes;
    }
    else {
      this.attributes = attributes;
      var meta = metadata_1.build(attributes);
      this.id = meta.id;
      this.idObjectId = meta.objectId;
      this.map = meta.map;
    }
    this.collection = db.collection(collectionName);
    this.metadata = this.metadata.bind(this);
    this.all = this.all.bind(this);
    this.load = this.load.bind(this);
    this.exist = this.exist.bind(this);
  }
  MongoLoader.prototype.metadata = function () {
    return this.attributes;
  };
  MongoLoader.prototype.all = function () {
    var _this = this;
    if (this.fromBson) {
      return mongo_1.findWithMap(this.collection, {}, this.id, this.map).then(function (v) { return v.map(function (o) { return _this.fromBson(o); }); });
    }
    else {
      return mongo_1.findWithMap(this.collection, {}, this.id, this.map);
    }
  };
  MongoLoader.prototype.load = function (id) {
    var _this = this;
    var query = { _id: (this.idObjectId ? new bson_1.ObjectId('' + id) : '' + id) };
    if (this.fromBson) {
      return mongo_1.findOne(this.collection, query, this.id, this.map).then(function (v) { return _this.fromBson(v); });
    }
    else {
      return mongo_1.findOne(this.collection, query, this.id, this.map);
    }
  };
  MongoLoader.prototype.exist = function (id) {
    var query = { _id: (this.idObjectId ? new bson_1.ObjectId('' + id) : '' + id) };
    return mongo_1.count(this.collection, query).then(function (c) { return c > 0; });
  };
  return MongoLoader;
}());
exports.MongoLoader = MongoLoader;
