"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var metadata_1 = require("./metadata");
var search_1 = require("./search");
var SearchBuilder = (function () {
  function SearchBuilder(collection, buildQuery, metadata, mp, sort, buildSort) {
    this.collection = collection;
    this.buildQuery = buildQuery;
    this.mp = mp;
    this.sort = sort;
    if (metadata) {
      if (typeof metadata === 'string') {
        this.idName = metadata;
      }
      else {
        this.metadata = metadata;
        var meta = metadata_1.build(metadata);
        this.idName = meta.id;
        this.map = meta.map;
      }
    }
    this.buildSort = (buildSort ? buildSort : search_1.buildSort);
    this.search = this.search.bind(this);
  }
  SearchBuilder.prototype.search = function (s, limit, skip, fields) {
    var st = (this.sort ? this.sort : 'sort');
    var sn = s[st];
    var so = this.buildSort(sn, this.metadata);
    delete s[st];
    var query = this.buildQuery(s, this.metadata);
    return search_1.buildSearchResult(this.collection, query, so, limit, skip, fields, this.idName, this.map, this.mp);
  };
  return SearchBuilder;
}());
exports.SearchBuilder = SearchBuilder;
