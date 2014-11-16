angular.module('app').directive('chordDiagram', ['$window', 'matrixFactory',

function ($window, matrixFactory) {

  var link = function ($scope, $el, $attr) {

    var size = [1000, 1000];
    var marg = [100, 100, 100, 100];
    var dims = [];
    dims[0] = size[0] - marg[1] - marg[3];
    dims[1] = size[1] - marg[0] - marg[2];

    var colors = d3.scale.ordinal()
      .range(['#665B52','#634B46','#EDD8B7','#E6C7A1','#E3BD8A','#9C7E5C','#99744E','#66453D','#663B33','#CC9766','#CCA37A','#CC9454','#B5967D','#B28F6B','#B28159','#635250','#4F473E','#4C342F','#4C3E3C','#4C3936','#4A3D35','#362820','#362725','#30201E','#211514']);

    var chord = d3.layout.chord()
      .padding(0.02)
      .sortSubgroups(d3.ascending)
      .sortChords(d3.ascending);

    var matrix = matrixFactory.chord()
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

    var r0 = (size[1] / 2) - 100;

    var arc = d3.svg.arc()
      .innerRadius(r0)
      .outerRadius(r0 + 20);

    var path = d3.svg.chord()
      .radius(r0);

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
      var groupData = matrix.groups();
      var chordData = matrix.chords();
      console.log("groupData", groupData);
      console.log("chordData", chordData);

      var groups = container.selectAll("g.group")
        .data(groupData, function (d) { return d._id; });
      
      var gEnter = groups.enter()
        .append("g")
        .attr("class", "group")
        .on("mouseover", mouseover)
        .on("mouseout", mouseout)
        .attr("transform", "translate(" + (dims[0] / 2) + "," + (dims[1] / 2) + ")");

      gEnter.append("path")
        .style("stroke", "none")
        .style("fill", function (d) { return colors(matrix.read(d).gname); })
        .style("opacity", 0.9)
        .attr("d", arc);
 
      gEnter.append("text")
        .attr("dy", ".35em")
        .attr("fill", "#fff")
        .style("font", "10px sans-serif")
        .text(function (d) {
          return d._id;
        });

      groups.select("path")
        .transition().duration(1500)
        .attrTween("d", matrix.groupTween(arc).bind(matrix));

      groups.select("text")
        .transition()
        .duration(1500)
        .attr("transform", function (d) {
          d.angle = (d.startAngle + d.endAngle) / 2;
          var r = "rotate(" + (d.angle * 180 / Math.PI - 90) + ")";
          var t = " translate(" + (r0 + 26) + ")";
          return r + t + (d.angle > Math.PI ? " rotate(180)" : " rotate(0)"); 
        })
        .attr("text-anchor", function (d) {
          return d.angle > Math.PI ? "end" : "begin";
        });

      groups.exit().remove();

      var chords = svg.selectAll("path.chord")
        .data(chordData, function (d) { return d._id; });

      var cEnter = chords.enter().append("path")
        .attr("class", "chord")
        .style("stroke", "none")
        .style("fill", function (d) {
          return colors(d._id);
        })
        .style("opacity", 0.8)
        .attr("d", path)
        .attr("transform", "translate(" + (size[0] / 2) + "," + (size[1] / 2) + ")");

      chords.transition().duration(1500)
        .attrTween("d", matrix.chordTween(path));

      chords.exit().remove();

      function mouseout(d, i) {
        chords.style("opacity",0.9);
      }

      function mouseover(d, i) {
        chords.style("opacity", function (p) {
          var sid = p.source._id;
          var tid = p.target._id;
          return (sid != d._id && tid != d._id) ? 0.1: 0.9;
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





