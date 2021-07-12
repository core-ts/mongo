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
var metadata_1 = require("./metadata");
var mongo_1 = require("./mongo");
var MongoLoader_1 = require("./MongoLoader");
var MongoWriter = (function (_super) {
  __extends(MongoWriter, _super);
  function MongoWriter(collection, attributes, toBson, fromBson) {
    var _this = _super.call(this, collection, attributes, fromBson) || this;
    _this.toBson = toBson;
    if (typeof attributes !== 'string') {
      _this.version = metadata_1.getVersion(attributes);
    }
    _this.insert = _this.insert.bind(_this);
    _this.update = _this.update.bind(_this);
    _this.patch = _this.patch.bind(_this);
    _this.save = _this.save.bind(_this);
    _this.delete = _this.delete.bind(_this);
    return _this;
  }
  MongoWriter.prototype.insert = function (obj) {
    if (this.version && this.version.length > 0) {
      obj[this.version] = 1;
    }
    return mongo_1.insert(this.collection, obj, this.id, true, this.toBson, this.fromBson);
  };
  MongoWriter.prototype.update = function (obj) {
    var _this = this;
    if (!this.version) {
      return mongo_1.update(this.collection, obj, this.id, this.toBson, this.fromBson);
    }
    else {
      var version = obj[this.version];
      if (!version || typeof version !== 'number') {
        return mongo_1.update(this.collection, obj, this.id, this.toBson, this.fromBson);
      }
      else {
        if (this.id) {
          mongo_1.revertOne(obj, this.id);
        }
        if (!obj['_id']) {
          return Promise.reject(new Error('Cannot update an object that do not have _id field: ' + JSON.stringify(obj)));
        }
        obj[this.version] = 1 + version;
        var filter = { _id: obj['_id'], version: version };
        return mongo_1.updateWithFilter(this.collection, obj, filter, this.toBson, this.fromBson).then(function (r) {
          mongo_1.mapOne(obj, _this.id, _this.map);
          return (r > 0 ? r : -1);
        });
      }
    }
  };
  MongoWriter.prototype.patch = function (obj) {
    var _this = this;
    if (!this.version) {
      return mongo_1.patch(this.collection, obj, this.id, this.toBson, this.fromBson);
    }
    else {
      var version = obj[this.version];
      if (!version || typeof version !== 'number') {
        return mongo_1.patch(this.collection, obj, this.id, this.toBson, this.fromBson);
      }
      else {
        if (this.id) {
          mongo_1.revertOne(obj, this.id);
        }
        if (!obj['_id']) {
          return Promise.reject(new Error('Cannot patch an object that do not have _id field: ' + JSON.stringify(obj)));
        }
        obj[this.version] = 1 + version;
        var filter = { _id: obj['_id'], version: version };
        return mongo_1.patchWithFilter(this.collection, obj, filter, this.toBson, this.fromBson).then(function (r) {
          mongo_1.mapOne(obj, _this.id, _this.map);
          return (r > 0 ? r : -1);
        });
      }
    }
  };
  MongoWriter.prototype.save = function (obj) {
    var _this = this;
    if (!this.version) {
      return mongo_1.upsert(this.collection, obj, this.id, this.toBson, this.fromBson);
    }
    else {
      var version = obj[this.version];
      if (!version || typeof version !== 'number') {
        return mongo_1.upsert(this.collection, obj, this.id, this.toBson, this.fromBson);
      }
      else {
        if (this.id) {
          mongo_1.revertOne(obj, this.id);
        }
        if (!obj['_id']) {
          obj[this.version] = 1;
          return mongo_1.insert(this.collection, obj, undefined, true, this.toBson, this.fromBson);
        }
        else {
          obj[this.version] = 1 + version;
          var filter = { _id: obj['_id'], version: version };
          return mongo_1.upsertWithFilter(this.collection, obj, filter, this.toBson, this.fromBson).then(function (r) {
            mongo_1.mapOne(obj, _this.id, _this.map);
            return (r > 0 ? r : -1);
          });
        }
      }
    }
  };
  MongoWriter.prototype.delete = function (id) {
    return mongo_1.deleteById(this.collection, id);
  };
  return MongoWriter;
}(MongoLoader_1.MongoLoader));
exports.MongoWriter = MongoWriter;
