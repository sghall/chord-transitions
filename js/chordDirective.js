angular.module('app').directive('chordDiagram', ['$window', 'matrixFactory',

function ($window, matrixFactory) {

  var link = function ($scope, $el, $attr) {

    var size = [1000, 1000]; // SVG SIZE WIDTH, HEIGHT
    var marg = [50, 50, 50, 50]; // TOP, RIGHT, BOTTOM, LEFT
    var dims = []; // USABLE DIMENSIONS
    dims[0] = size[0] - marg[1] - marg[3]; // WIDTH
    dims[1] = size[1] - marg[0] - marg[2]; // HEIGHT

    var colors = d3.scale.ordinal()
      .range(['#9C6744','#C9BEB9','#C4BAA1','#C2B6BF','#121212','#8FB5AA','#85889E','#9C7989','#91919C','#242B27','#212429','#99677B','#36352B','#33332F','#2B2B2E','#2E1F13','#2B242A','#918A59','#6E676C','#6E4752','#6B4A2F','#998476','#8A968D','#968D8A','#968D96','#967860','#929488','#949278','#A0A3BD','#BD93A1','#65666B','#6B5745','#6B6664','#695C52','#56695E','#69545C','#565A69','#696043','#63635C','#636150','#333131','#332820','#302D30','#302D1F','#2D302F','#CFB6A3','#CFA07E','#CC855C','#362F2A']);

    var chord = d3.layout.chord()
      .padding(0.02)
      .sortSubgroups(d3.ascending);

    var matrix = matrixFactory.chordMatrix()
      .layout(chord)
      .filter(function (item, r, c) {
        return (item.importer1 === r.name && item.importer2 === c.name) ||
               (item.importer1 === c.name && item.importer2 === r.name);
      })
      .reduce(function (items, r, c) {
        var value;
        if (!items[0]) {
          value = 0;
        } else {
          value = items.reduce(function (m, n) {
            if (r === c) {
              return m + (n.flow1 + n.flow2);
            } else {
              return m + (n.importer1 === r.name ? n.flow1: n.flow2);
            }
          }, 0);
        }
        return {value: value, data: items};
      });

    var innerRadius = (dims[1] / 2) - 100;

    var arc = d3.svg.arc()
      .innerRadius(innerRadius)
      .outerRadius(innerRadius + 20);

    var path = d3.svg.chord()
      .radius(innerRadius);

    var svg = d3.select($el[0]).append("svg")
      .attr("class", "chart")
      .attr({width: size[0] + "px", height: size[1] + "px"})
      .attr("viewBox", "0 0 " + size[0] + " " + size[1]);

    var container = svg.append("g")
      .attr("id", "container")
      .attr("transform", "translate(" + marg[3] + "," + marg[0] + ")");

    $scope.drawChords = function (data) {

      matrix.data(data)
        .resetKeys()
        .addKeys(['importer1', 'importer2'])
        .update()

      var groups = container.selectAll("g.group")
        .data(matrix.groups(), function (d) { return d._id; });
      
      var gEnter = groups.enter()
        .append("g")
        .attr("class", "group")
        .on("click", groupClick)
        .on("mouseover", dimChords)
        .on("mouseout", resetChords)
        .attr("transform", "translate(" + (dims[0] / 2) + "," + (dims[1] / 2) + ")");

      gEnter.append("path")
        .style("fill", function (d) { return colors(d._id); })
        .attr("d", arc);
 
      gEnter.append("text")
        .attr("dy", ".35em")
        .text(function (d) {
          return d._id;
        });

      groups.select("path")
        .transition().duration(2000)
        .attrTween("d", matrix.groupTween(arc));

      groups.select("text")
        .transition()
        .duration(2000)
        .attr("transform", function (d) {
          d.angle = (d.startAngle + d.endAngle) / 2;
          var r = "rotate(" + (d.angle * 180 / Math.PI - 90) + ")";
          var t = " translate(" + (innerRadius + 26) + ")";
          return r + t + (d.angle > Math.PI ? " rotate(180)" : " rotate(0)"); 
        })
        .attr("text-anchor", function (d) {
          return d.angle > Math.PI ? "end" : "begin";
        });

      groups.exit().select("text").attr("fill", "orange");
      groups.exit().select("path").remove();

      groups.exit().transition().duration(1000)
        .style("opacity", 0).remove();

      var chords = container.selectAll("path.chord")
        .data(matrix.chords(), function (d) { return d._id; });

      chords.enter().append("path")
        .attr("class", "chord")
        .style("fill", function (d) {
          return colors(d.source._id);
        })
        .attr("d", path)
        .on("mouseover", chordMouseover)
        .on("mouseout", chordMouseout)
        .attr("transform", "translate(" + (dims[0] / 2) + "," + (dims[1] / 2) + ")");

      chords.transition().duration(2000)
        .attrTween("d", matrix.chordTween(path));

      chords.exit().remove()

      function groupClick(d) {
        $scope.addFilter(d._id);
        resetChords();
      }

      function chordMouseover(d) {
        dimChords(d);
        d3.select("#tooltip").style("opacity", 1);
        $scope.updateTooltip(matrix.read(d));
      }

      function chordMouseout() {
        d3.select("#tooltip").style("opacity", 0);
        resetChords();
      }

      function resetChords() {
        container.selectAll("path.chord").style("opacity",0.9);
      }

      function dimChords(d) {
        container.selectAll("path.chord").style("opacity", function (p) {
          if (d.source) { // COMPARE CHORD IDS
            return (p._id === d._id) ? 0.9: 0.1;
          } else { // COMPARE GROUP IDS
            return (p.source._id === d._id || p.target._id === d._id) ? 0.9: 0.1;
          }
        });
      }
    }; // END DRAWCHORDS FUNCTION

    function resize() {
      var width = $el.parent()[0].clientWidth;
      svg.attr({
        width: width,
        height: width / (size[0] / size[1])
      });
    }

    resize();
      
    $window.addEventListener("resize", function () {
      resize();
    });
  }; // END LINK FUNCTION

  return {
    link: link,
    restrict: 'EA'
  };

}]);





