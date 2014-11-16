angular.module('app').factory('matrixFactory', [function () {

  var chordMatrix = function () {
    var id = 0, keys = {}, store = [];

    var _matrix, _mindex;
    var _find = function () {};
    var _fold = function () {};

    var matrix = {};

    var _layout, _layoutCache;

    matrix.genMatrix = function (layout) {
      _matrix = [], recs = [], entry = {};
      _mindex = Object.keys(keys);

      if(_layout) {
        _layoutCache.groups = _layout.groups();
        _layoutCache.chords = _layout.chords();
      }
      _layout = layout;

      for (var i = 0; i < _mindex.length; i++) {
        for (var j = 0; j < _mindex.length; j++) {
          recs = data.filter(function (row) {
            return _find(row, keys[_mindex[i]], keys[_mindex[j]]);
          });
          entry = _fold(recs, keys[_mindex[i]], keys[_mindex[j]]);
          entry.valueOf = function () { return +this.value };
          matrix[i][j] = entry;
        }
      }
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

    matrix.add = function (key, data) {
      if (!keys[key]) {
        keys[key] = {name: value, data: data || {}};
      }
    };

    matrix.addKeys = function (prop, func) {
      for (var i = 0; i < store.length; i++) {
        if (!keys[store[i][prop]])) {
          this.add(store[i][prop], func ? func(store, prop):{});
        }
      }
      return this;
    };

    matrix.getChordID = function (d) {
      var s = _mindex(d.source.index, d.source.subindex);
      var t = _mindex(d.target.index, d.target.subindex);
      return (s.name < t.name) ?
        s.name + "-" + t.name:
        t.name + "-" + s.name;
    };

    matrix.groupTween = function (arc) {
      var cache = {};

      if (_layoutCache) {
        _layoutCache.groups.forEach(function (d) {
          cache[_mindex[d.index].name] = d;
        });
      }

      return function (d, i) {
        var tween; 
        var cached = cache[_mindex[d.index].name];

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

      var cache = {};
      
      if (_layoutCache) {
        _layoutCache.chords.forEach(function (d) {
          cache[this.getChordID(d)] = d;
        });
      }
      
      return function (d, i) {
        var tween, groups;
        var cached = cache[this.getChordID(d)];

        if (cached) {
          if (d.source.index != cached.source.index){
            cached = {source: cached.target, target: cached.source};
          }
          tween = d3.interpolate(cached, d);
        } else {
          if (_layoutCache) {
            groups = _layoutCache.groups.filter(function (group) {
              return ((group.index == d.source.index) || (group.index == d.target.index));
            });

            cached = {source: groups[0], target: groups[1] || groups[0]};

            if (d.source.index != cached.source.index) {
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
  };

  return {
    chord: chordMatrix
  };
}]);