"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var metadata_1 = require("./metadata");
var search_1 = require("./search");
var SearchBuilder = (function () {
  function SearchBuilder(db, collectionName, buildQuery, metadata, toBson, sort, q, excluding, buildSort) {
    this.buildQuery = buildQuery;
    this.toBson = toBson;
    this.sort = sort;
    if (metadata) {
      if (typeof metadata === "string") {
        this.id = metadata;
      }
      else {
        this.attributes = metadata;
        var meta = metadata_1.build(metadata);
        this.id = meta.id;
        this.map = meta.map;
      }
    }
    this.collection = db.collection(collectionName);
    this.buildSort = buildSort ? buildSort : search_1.buildSort;
    this.q = q && q.length > 0 ? q : "q";
    this.excluding = excluding && excluding.length > 0 ? excluding : "excluding";
    this.search = this.search.bind(this);
  }
  SearchBuilder.prototype.search = function (filter, limit, page, fields) {
    var offset = 0;
    if (typeof page === "number" && page >= 1) {
      offset = getOffset(limit, page);
    }
    var st = this.sort ? this.sort : "sort";
    var sn = filter[st];
    var so = this.buildSort(sn, this.attributes);
    delete filter[st];
    var query = this.buildQuery(filter, this.attributes, this.q, this.excluding);
    return search_1.buildSearchResult(this.collection, query, so, limit, page, fields, this.id, this.map, this.toBson);
  };
  return SearchBuilder;
}());
exports.SearchBuilder = SearchBuilder;
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
