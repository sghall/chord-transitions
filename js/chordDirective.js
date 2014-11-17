angular.module('app').directive('chordDiagram', ['$window', 'matrixFactory',

function ($window, matrixFactory) {

  var link = function ($scope, $el, $attr) {

    var size = [1000, 1000];
    var marg = [80, 50, 50, 50];
    var dims = [];
    dims[0] = size[0] - marg[1] - marg[3];
    dims[1] = size[1] - marg[0] - marg[2];

    var colors = d3.scale.ordinal()
      .range(['#99744E','#66453D','#663B33','#CC9766','#CCA37A','#CC9454','#B5967D','#B28F6B','#B28159','#635250','#4F473E','#4C342F','#4C3E3C','#4C3936','#4A3D35','#362820','#362725','#30201E','#211514','#665B52','#634B46','#EDD8B7','#E6C7A1','#E3BD8A','#9C7E5C']);

    var chord = d3.layout.chord()
      .padding(0.02)
      .sortSubgroups(d3.ascending);

    var matrix = matrixFactory.chordMatrix()
      .layout(chord)
      .filter(function (row, a, b) {
        return (row.importer1 === a.name && row.importer2 === b.name) ||
               (row.importer1 === b.name && row.importer2 === a.name)
      })
      .reduce(function (recs, a, b) {
        var value;
        if (!recs[0]) {
           value = 0;
        } else {
          value = recs[0].importer1 === a.name ? +recs[0].flow1 : +recs[0].flow2;
        }
        return {value: value, data: recs[0]}; 
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
      .attr("transform", "translate(" + marg[1] + "," + marg[0] + ")");

    $scope.drawChords = function (data) {

      matrix.data(data)
        .resetKeys()
        .addKeys('importer1')
        .addKeys('importer2')

      matrix.update()

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
        .style("fill", function (d) { return colors(matrix.read(d).gname); })
        .attr("d", arc);
 
      gEnter.append("text")
        .attr("dy", ".35em")
        .text(function (d) {
          return d._id;
        });

      groups.select("path")
        .transition().duration(2000)
        .attrTween("d", matrix.groupTween(arc).bind(matrix));

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
          if (d.source) {
            return (p._id === d._id) ? 0.9: 0.1;
          } else {
            return (p.source._id === d._id || p.target._id === d._id) ? 0.9: 0.1;
          }
        });
      }
    }; // END DRAWCHORDS FUNCTION

    //******************************************************************************
    // HELPER FUNCTIONS
    //******************************************************************************
    function resize() {
      var width = $($el[0]).parent().width();
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





