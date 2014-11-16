angular.module('app').factory('matrixFactory', [function () {

  var chordMatrix = function () {
    var _id = 0, _keys = {}, _store = [];

    var _matrix, _mindex
    var _find = function () {};
    var _fold = function () {};

    var _layout, _layoutCache;

    var matrix = {};

    matrix.genMatrix = function (numbers) {
      _matrix = [], recs = [], entry = {};

      _layoutCache = {};

      _layout.groups().forEach(function (group) {
        _layoutCache[_mindex[group.index]] = group;
      });

      _layout.chords().forEach(function (chord) {
        _layoutCache[this.getChordID(chord)] = chord;
      });

      _mindex = Object.keys(_keys);

      for (var i = 0; i < _mindex.length; i++) {
        for (var j = 0; j < _mindex.length; j++) {
          recs = _store.filter(function (row) {
            return _find(row, _keys[_mindex[i]], _keys[_mindex[j]]);
          });
          entry = _fold(recs, _keys[_mindex[i]], _keys[_mindex[j]]);
          entry.valueOf = function () { return +this.value };
          matrix[i][j] = numbers ? +entry: entry;
        }
      }
      _layout.matrix(_matrix);
      return _matrix;
    };

    matrix.data = function (data) {
      this.store = data;
      return this;
    };

    matrix.find = function (func) {
      _find = func;
      return this;
    };

    matrix.fold = function (func) {
      _fold = func;
      return this;
    };

    matrix.layout = function (d3_layout) {
      _layout = d3_layout;
      return this;
    };

    matrix.groups = function () {
      return _layout.groups();
    };

    matrix.chords = function () {
      return _layout.chords();
    };

    matrix.addKey = function (key, data) {
      if (!_keys[key]) {
        _keys[key] = {name: value, data: data || {}};
      }
    };

    matrix.addKeys = function (prop, func) {
      for (var i = 0; i < store.length; i++) {
        if (!_keys[_store[i][prop]])) {
          this.addKey(_store[i][prop], func ? func(_store, prop):{});
        }
      }
      return this;
    };

    matrix.getChordID = function (d) {
      var s = _mindex[d.source.index];
      var t = _mindex[d.target.index];
      return (s < t) ? s + "___" + t: t + "___" + s;
    };

    matrix.groupTween = function (arc) {

      return function (d, i) {
        var tween; 
        var cached = _layoutCache[_mindex[d.index]];

        if (cached) {
          tween = d3.interpolate(cached, d);
        } else {
          tween = d3.interpolate({
            startAngle:d.startAngle,
            endAngle:d.startAngle
          }, d);
        }

        return function (t) {
          return arc(tween(t));
        };
      };
    };

    matrix.ChordTween = function (path) {

      return function (d, i) {
        var tween, groups;
        var cached = _layoutCache[this.getChordID(d)];

        if (cached) {
          if (d.source.index !== cached.source.index){
            cached = {source: cached.target, target: cached.source};
          }
          tween = d3.interpolate(cached, d);
        } else {
          if (_layoutCache) {
            groups = _layoutCache.groups.filter(function (group) {
              return ((group.index === d.source.index) || (group.index === d.target.index));
            });

            cached = {source: groups[0], target: groups[1] || groups[0]};

            if (d.source.index !== cached.source.index) {
              cached = {source: cached.target, target: cached.source};
            }
          } else {
            cached = d;
          }

          tween = d3.interpolate({
            source: { 
              startAngle: cached.source.startAngle,
              endAngle: cached.source.startAngle
            },
            target: { 
              startAngle: cached.target.startAngle,
              endAngle: cached.target.startAngle
            }
          }, d);
        }

        return function (t) {
          return path(tween(t));
        };
      };
    };
    return matrix;
  };

  return {
    chord: chordMatrix
  };
}]);