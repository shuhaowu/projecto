"use strict";

window.datastructures = {};

window.datastructures.LinkedMap = (function() {
  function Value(key, value, next, prev) {
    this.key = key;
    this.value = value;
    this.next = next;
    this.prev = prev;
  };

  function LinkedMap() {
    this.map = {};
    this.first = null;
    this.last = null;
  };

  LinkedMap.prototype.prepend = function(k, v) {
    if (this.map[k]) {
      this.map[k].value = v;
    } else {
      this.map[k] = new Value(k, v);
      var current_first;
      if (current_first = this.first) {
        this.map[k].next = current_first;
        this.map[current_first].prev = k;
      }
      this.first = k;
    }

    return this;
  };

  LinkedMap.prototype.put = function(k, v) {
    if (this.map[k]) {
      this.map[k].value = v;
    } else {
      this.map[k] = new Value(k, v);
      if (!this.first) {
        this.first = k;
        this.last = k;
      } else {
        this.map[this.last].next = k;
        this.map[k].prev = this.last;
        this.last = k;
      }
    }

    return this;
  };

  LinkedMap.prototype.append = LinkedMap.prototype.put;

  LinkedMap.prototype.remove = function(k) {
    if (this.map[k]) {
      var prev, next;

      if (k === this.first) {
        next = this.map[k].next;
        if (this.map[next]) {
          this.first = next;
          this.map[next].prev = null;
        } else {
          this.first = null;
          this.last = null;
        }
      } else if (k === this.last) {
        prev = this.map[k].prev;
        this.map[prev].next = undefined;
        this.last = prev;
      } else {
        prev = this.map[k].prev;
        next = this.map[k].next;

        if (prev && next) {
          this.map[prev].next = next;
          this.map[next].prev = prev;
        }
      }

      var r = this.map[k].value;
      delete this.map[k];
      return r;
    }
  };

  LinkedMap.prototype.get = function(k) {
    var v;
    if (v = this.map[k]) {
      return v.value;
    } else {
      return undefined;
    }
  };

  LinkedMap.prototype.contains = function(k) {
    return !!this.map[k];
  };

  LinkedMap.prototype.listify = function() {
    var l = [];
    var current = this.map[this.first];
    while (current) {
      l.push({key: current.key, value: current.value});
      current = this.map[current.next];
    }
    return l;
  };

  LinkedMap.prototype.length = function() {
    return Object.keys(this.map).length;
  };

  return LinkedMap;

})();
