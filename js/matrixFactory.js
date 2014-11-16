angular.module('app').factory('matrixFactory', [function () {

  var chordMatrix = function () {
    var _id = 0, _keys = {}, _store = [];

    var _matrix, _index;
    var _filter = function () {};
    var _reduce = function () {};

    var _layout, _cache;

    var matrix = {};

    matrix.genMatrix = function (numbers) {
      _matrix = [], recs = [], entry = {};

      _cache = {groups: {}, chords: {}};

      _layout.groups().forEach(function (group) {
        _cache.groups[_index[group.index]] = group;
      });

      _layout.chords().forEach(function (chord) {
        _cache.chords[chordID(chord)] = chord;
      });

      _index = Object.keys(_keys);

      for (var i = 0; i < _index.length; i++) {
        if (!_matrix[i]) {
          _matrix[i] = [];
        }
        for (var j = 0; j < _index.length; j++) {
          recs = _store.filter(function (row) {
            return _filter(row, _keys[_index[i]], _keys[_index[j]]);
          });
          entry = _reduce(recs, _keys[_index[i]], _keys[_index[j]]);
          entry.valueOf = function () { return +this.value };
          _matrix[i][j] = numbers ? +entry: entry;
        }
      }
      _layout.matrix(_matrix);
      return _matrix;
    };

    matrix.data = function (data) {
      _store = data;
      return this;
    };

    matrix.filter = function (func) {
      _filter = func;
      return this;
    };

    matrix.reduce = function (func) {
      _reduce = func;
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
        _keys[key] = {name: key, data: data || {}};
      }
    };

    matrix.addKeys = function (prop, func) {
      for (var i = 0; i < _store.length; i++) {
        if (!_keys[_store[i][prop]]) {
          this.addKey(_store[i][prop], func ? func(_store, prop):{});
        }
      }
      return this;
    };

    matrix.resetKeys = function () {
      _keys = {};
      return this;
    };

    function chordID(d) {
      var s = _index[d.source.index];
      var t = _index[d.target.index];
      return (s < t) ? s + "__" + t: t + "__" + s;
    }

    matrix.groupTween = function (d3_arc) {

      return function (d, i) {
        var tween; 
        var cached = _cache.groups[_index[d.index]];

        if (cached) {
          tween = d3.interpolate(cached, d);
        } else {
          tween = d3.interpolate({
            startAngle:d.startAngle,
            endAngle:d.startAngle
          }, d);
        }

        return function (t) {
          return d3_arc(tween(t));
        };
      };
    };

    matrix.chordTween = function (d3_path) {

      return function (d, i) {
        var tween, groups;
        var cached = _cache.chords[chordID(d)];

        if (cached) {
          if (d.source.index !== cached.source.index){
            cached = {source: cached.target, target: cached.source};
          }
          tween = d3.interpolate(cached, d);
        } else {
          if (_cache.groups) {
            groups = [];

            for (var key in _cache.groups) {
              cached = _cache.groups[key];
              if (cached.index === d.source.index || cached.index === d.target.index) {
                groups.push(cached);
              }
            }
            if (groups.length > 0) {
              cached = {source: groups[0], target: groups[1] || groups[0]};
              if (d.source.index !== cached.source.index) {
                cached = {source: cached.target, target: cached.source};
              }
            } else {
              cached = d;
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
          return d3_path(tween(t));
        };
      };
    };
    return matrix;
  };

  return {
    chord: chordMatrix
  };
}]);