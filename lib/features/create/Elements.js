import {
  filter,
  find,
  forEach,
  isArray,
  map,
  reduce,
  sortBy,
  without
} from 'min-dash';

export default function Elements(elements) {
  elements = elements || [];

  if (!isArray(elements)) {
    elements = [ elements ];
  }

  this._elements = elements;
}

Elements.prototype.add = function(element) {
  this._elements.push(element);
};

Elements.prototype.remove = function(element) {
  this._elements = without(this._elements, element);
};

Elements.prototype.replace = function(element, replacement) {
  var index = this._elements.indexOf(element);

  if (index === -1) {
    return;
  }

  this._elements[index] = replacement;
};

Elements.prototype.getAll = function() {
  return this._elements;
};

Elements.prototype.filter = function(fn) {
  return filter(this._elements, fn);
};

Elements.prototype.find = function(fn) {
  return find(this._elements, fn);
};

Elements.prototype.forEach = function(fn) {
  return forEach(this._elements, fn);
};

Elements.prototype.map = function(fn) {
  return map(this._elements, fn);
};

Elements.prototype.reduce = function(fn, initialValue) {
  return reduce(this._elements, fn, initialValue);
};

Elements.prototype.sortBy = function(fn) {
  return sortBy(this._elements, fn);
};