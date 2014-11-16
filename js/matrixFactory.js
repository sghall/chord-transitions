angular.module('app').factory('matrixFactory', [function () {

  var chordMatrix = function () {
    var _id = 0, _keys = {}, _store = [];

    var _matrix;
    var _filter = function () {};
    var _reduce = function () {};

    var _index;
    var _layout, _layoutCache;

    var matrix = {};

    matrix.update = function () {
      _matrix = [], recs = [], entry = {};

      _layoutCache = {groups: {}, chords: {}};

      _layout.groups().forEach(function (group) {
        _layoutCache.groups[_index[group.index]] = group;
      });

      _layout.chords().forEach(function (chord) {
        _layoutCache.chords[chordID(chord)] = chord;
      });

      console.log("_layoutCache", _layoutCache);

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
          _matrix[i][j] = entry;
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
      return _layout.groups().map(function (group) {
        group._id = _index[group.index];
        return group;
      });
    };

    matrix.chords = function () {
      return _layout.chords().map(function (chord) {
        chord._id = chordID(chord);
        chord.source._id = _index[chord.source.index];
        chord.target._id = _index[chord.target.index];
        return chord;
      });
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
        var cached = _layoutCache.groups[_index[d.index]];

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
      console.log("chord", _layoutCache);
      return function (d, i) {
        var tween, groups;
        var cached = _layoutCache.chords[chordID(d)];

        if (cached) {
          // if (d.source.index !== cached.source.index){
          //   cached = {source: cached.target, target: cached.source};
          // }
          tween = d3.interpolate(cached, d);
        } else {
          if (_layoutCache.groups) {
            groups = [];
            for (var key in _layoutCache.groups) {
              cached = _layoutCache.groups[key];
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

    matrix.read = function (d) {
      var s, t, g, m = {};
      if (d.source) {
        s = _matrix[d.source.index][d.source.subindex];
        t = _matrix[d.target.index][d.target.subindex];
        m.sname  = _keys[_index[d.source.index]].name;
        m.sdata  = d.source.value;
        m.svalue = +d.source.value;
        m.stotal = _matrix[d.source.index].reduce(function (k, n) { return k + n; }, 0);
        m.tname  = _keys[_index[d.target.index]].name;
        m.tdata  = d.target.value;
        m.tvalue = +d.target.value;
        m.ttotal = _matrix[d.target.index].reduce(function (k, n) { return k + n; }, 0);
      } else {
        g = _keys[_index[d.index]]
        // console.log("keys", _keys, "index", _index, "d", d);
        m.gname  = _keys[_index[d.index]].name;
        m.gdata  = g.data;
        m.gvalue = d.value;
      }
      m.mtotal = _matrix.reduce(function (m1, n1) { 
        return m1 + n1.reduce(function (m2, n2) { return m2 + n2; }, 0);
      }, 0);
      return m;
    };

    return matrix;
  };

  return {
    chord: chordMatrix
  };
}]);