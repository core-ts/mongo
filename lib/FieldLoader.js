"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongo_1 = require("./mongo");
var FieldLoader = (function () {
  function FieldLoader(db, collectionName, field) {
    this.field = field;
    this.collection = db.collection(collectionName);
    this.values = this.values.bind(this);
  }
  FieldLoader.prototype.values = function (ids) {
    return mongo_1.getFields(this.collection, this.field, ids);
  };
  return FieldLoader;
}());
exports.FieldLoader = FieldLoader;
