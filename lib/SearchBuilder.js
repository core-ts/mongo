"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var metadata_1 = require("./metadata");
var search_1 = require("./search");
var SearchBuilder = (function () {
  function SearchBuilder(db, collectionName, buildQuery, metadata, toBson, sort, buildSort) {
    this.buildQuery = buildQuery;
    this.toBson = toBson;
    this.sort = sort;
    if (metadata) {
      if (typeof metadata === 'string') {
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
    this.buildSort = (buildSort ? buildSort : search_1.buildSort);
    this.search = this.search.bind(this);
  }
  SearchBuilder.prototype.search = function (s, limit, skip, fields) {
    var st = (this.sort ? this.sort : 'sort');
    var sn = s[st];
    var so = this.buildSort(sn, this.attributes);
    delete s[st];
    var query = this.buildQuery(s, this.attributes);
    return search_1.buildSearchResult(this.collection, query, so, limit, skip, fields, this.id, this.map, this.toBson);
  };
  return SearchBuilder;
}());
exports.SearchBuilder = SearchBuilder;
