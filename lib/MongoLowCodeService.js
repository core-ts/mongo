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
var MongoWriter_1 = require("./MongoWriter");
var query_1 = require("./query");
var search_1 = require("./search");
var MongoLowCodeService = (function (_super) {
  __extends(MongoLowCodeService, _super);
  function MongoLowCodeService(db, model, buildQ, buildOrder, toBson, fromBson) {
    var _this = _super.call(this, db, metadata_1.getCollectionName(model), model.attributes) || this;
    _this.db = db;
    _this.model = model;
    _this.sort = (model.sort && model.sort.length > 0 ? model.sort : 'sort');
    _this.buildQuery = (buildQ ? buildQ : query_1.buildQuery);
    _this.buildSort = (buildOrder ? buildOrder : search_1.buildSort);
    _this.toBson = toBson;
    _this.fromBson = fromBson;
    if (!fromBson && !toBson && model.geo && model.latitude && model.longitude && model.geo.length > 0 && model.latitude.length > 0 && model.longitude.length > 0) {
      var mapper = new mongo_1.PointMapper(model.geo, model.latitude, model.longitude);
      _this.toBson = mapper.toPoint;
      _this.fromBson = mapper.fromPoint;
    }
    _this.search = _this.search.bind(_this);
    return _this;
  }
  MongoLowCodeService.prototype.search = function (s, limit, skip, fields) {
    var st = (this.sort ? this.sort : 'sort');
    var sn = s[st];
    var so = this.buildSort(sn, this.attributes);
    delete s[st];
    var query = this.buildQuery(s, this.attributes);
    return search_1.buildSearchResult(this.collection, query, so, limit, skip, fields, this.id, this.map, this.fromBson);
  };
  return MongoLowCodeService;
}(MongoWriter_1.MongoWriter));
exports.MongoLowCodeService = MongoLowCodeService;
