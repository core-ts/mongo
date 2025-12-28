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
var query_1 = require("./query");
var search_1 = require("./search");
var SearchBuilder_1 = require("./SearchBuilder");
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
var Repository = (function (_super) {
  __extends(Repository, _super);
  function Repository(db, collectionName, attributes, buildQuery, toBson, fromBson, sort, q, excluding, buildSort) {
    var _this = _super.call(this, db, collectionName, attributes, toBson, fromBson) || this;
    _this.sort = sort;
    _this.buildQuery = buildQuery ? buildQuery : query_1.buildQuery;
    _this.buildSort = buildSort ? buildSort : search_1.buildSort;
    _this.q = q && q.length > 0 ? q : "q";
    _this.excluding = excluding && excluding.length > 0 ? excluding : "excluding";
    _this.search = _this.search.bind(_this);
    return _this;
  }
  Repository.prototype.search = function (filter, limit, page, fields) {
    var offset = 0;
    if (typeof page === "number" && page >= 1) {
      offset = SearchBuilder_1.getOffset(limit, page);
    }
    var st = this.sort ? this.sort : "sort";
    var sn = filter[st];
    var so = this.buildSort(sn, this.attributes);
    var query = this.buildQuery(filter, this.attributes, this.q, this.excluding);
    return search_1.buildSearchResult(this.collection, query, so, limit, page, fields, this.id, this.map, this.toBson);
  };
  return Repository;
}(MongoWriter_1.MongoWriter));
exports.Repository = Repository;
