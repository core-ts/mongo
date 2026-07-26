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
var mongodb_1 = require("mongodb");
var metadata_1 = require("./metadata");
var mongo_1 = require("./mongo");
var query_1 = require("./query");
var search_1 = require("./search");
var SearchRepository = (function () {
  function SearchRepository(db, collectionName, metadata, buildQuery, fromBson, sort, q, excluding, buildSort) {
    this.fromBson = fromBson;
    this.sort = sort;
    if (metadata) {
      if (typeof metadata === "string") {
        this.id = metadata;
      }
      else {
        this.attrs = metadata;
        var meta = metadata_1.build(metadata);
        this.id = meta.id;
        this.map = meta.map;
      }
    }
    this.buildQuery = buildQuery ? buildQuery : query_1.buildQuery;
    this.collection = db.collection(collectionName);
    this.buildSort = buildSort ? buildSort : search_1.buildSort;
    this.q = q && q.length > 0 ? q : "q";
    this.excluding = excluding && excluding.length > 0 ? excluding : "excluding";
    this.search = this.search.bind(this);
  }
  SearchRepository.prototype.search = function (filter, limit, page, fields) {
    var offset = 0;
    if (typeof page === "number" && page >= 1) {
      offset = getOffset(limit, page);
    }
    var st = this.sort ? this.sort : "sort";
    var sn = filter[st];
    var so = this.buildSort(sn, this.attrs);
    var query = this.buildQuery(filter, this.attrs, this.q, this.excluding);
    return search_1.buildSearchResult(this.collection, query, so, limit, offset, fields, this.id, this.map, this.fromBson);
  };
  return SearchRepository;
}());
exports.SearchRepository = SearchRepository;
function getOffset(limit, page, ifirstPageSize) {
  if (ifirstPageSize && ifirstPageSize > 0) {
    var offset = limit * (page - 2) + ifirstPageSize;
    return offset < 0 ? 0 : offset;
  }
  else {
    var offset = limit * (page - 1);
    return offset < 0 ? 0 : offset;
  }
}
exports.getOffset = getOffset;
exports.SearchBuilder = SearchRepository;
var Query = (function (_super) {
  __extends(Query, _super);
  function Query(db, collectionName, metadata, buildQuery, fromBson, sort, q, excluding, buildSort, idObjectId) {
    var _this = _super.call(this, db, collectionName, metadata, buildQuery, fromBson, sort, q, excluding, buildSort) || this;
    _this.idObjectId = idObjectId;
    return _this;
  }
  Query.prototype.metadata = function () {
    return this.attrs;
  };
  Query.prototype.all = function () {
    var fn = this.fromBson;
    if (fn) {
      return mongo_1.findWithMap(this.collection, {}, this.id, this.map).then(function (v) { return v.map(function (o) { return fn(o); }); });
    }
    else {
      return mongo_1.findWithMap(this.collection, {}, this.id, this.map);
    }
  };
  Query.prototype.load = function (id) {
    var _this = this;
    var query = { _id: this.idObjectId ? new mongodb_1.ObjectId("" + id) : "" + id };
    return mongo_1.findOne(this.collection, query, this.id, this.map).then(function (v) {
      if (v) {
        if (_this.fromBson) {
          return _this.fromBson(v);
        }
        else {
          return v;
        }
      }
      else {
        return v;
      }
    });
  };
  Query.prototype.exist = function (id) {
    var query = { _id: this.idObjectId ? new mongodb_1.ObjectId("" + id) : "" + id };
    return mongo_1.count(this.collection, query).then(function (c) { return c > 0; });
  };
  return Query;
}(SearchRepository));
exports.Query = Query;
