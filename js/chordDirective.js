angular.module('app').directive('chordDiagram', ['$window', 'matrixFactory',

function ($window, matrixFactory) {

  var link = function ($scope, $el, $attr) {

    var size = [600, 600];
    var marg = [25, 45, 30, 20];
    var dims = [];
    dims[0] = size[0] - marg[1] - marg[3];
    dims[1] = size[1] - marg[0] - marg[2];

    var colors = d3.scale.ordinal()
      .range(['rgb(249,130,69)','rgb(188,68,6)','rgb(249,177,69)','rgb(4,125,86)','rgb(130,130,130)','rgb(188,115,6)','rgb(239,93,20)','rgb(46,165,126)','rgb(148,89,0)','rgb(255,159,111)','rgb(24,88,156)','rgb(54,107,162)','rgb(13,159,111)','rgb(6,50,96)','rgb(239,151,20)','rgb(0,98,66)','rgb(81,186,152)','rgb(255,197,111)','rgb(148,50,0)','rgb(88,134,183)']);

    function getLayout() {
      return d3.layout.chord()
      .padding(0.01)
      .sortSubgroups(d3.descending)
      .sortChords(d3.ascending);
    }

    var layout, cached;

    var r0 = (size[1] / 2) - 100;

    var arc = d3.svg.arc()
      .innerRadius(r0)
      .outerRadius(r0 + 20);

    var path = d3.svg.chord()
      .radius(r0);

    var svg = d3.select($el[0]).append("svg")
      .attr("class", "chart")
      .style("background-color", "rgba(0,0,0,0.3)")
      .attr({width: size[0] + "px", height: size[1] + "px"})
      .attr("viewBox", "0 0 " + size[0] + " " + size[1])
      .style("opacity", 0);

    svg.transition().duration(1500)
      .ease("linear")
      .style("opacity", 1);

    var container = svg.append("g")
      .attr("id", "container")
      .attr("transform", "translate(" + marg[1] + "," + marg[0] + ")");

    var outer = svg.append("g")
      .attr("id", "circle")
      .attr("transform", "translate(" + (size[0] / 2) + "," + (size[1] / 2) + ")")
      .append("circle").attr("r", r0 + 20).attr("fill", "none");

    $scope.drawChords = function (matrix, mmap) {

      cached = layout;
      layout = getLayout();
      layout.matrix(matrix);

      var reader = chordPrvdr.reader(matrix, mmap);

      console.log("Matrix:", matrix);

      var groups = svg.selectAll("g.group")
        .data(layout.groups(), function (d) { return d.index; });
      
      var gEnter = groups.enter()
        .append("g")
        .attr("class", "group")
        .on("mouseover", mouseover)
        .attr("transform", "translate(" + (size[0] / 2) + "," + (size[1] / 2) + ")");

      gEnter.append("path")
        .style("stroke", "grey")
        .style("fill", function (d) { return colors(d.index); })
        .style("opacity", 0.7)
        .attr("d", arc);
 
      gEnter.append("text")
        .attr("dy", ".35em")
        .attr("color", "#fff")
        .style("font", "5px sans-serif")
        .text(function (d) {
          console.log(reader(d).gname);
          return reader(d).gname;
        });

      groups.select("path")
        .transition().duration(1500)
        .attrTween("d", chordPrvdr.groupTween(arc, cached));

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
        .data(layout.chords(), chordPrvdr.geyChordKey)

      var cEnter = chords.enter().append("path")
        .attr("class", "chord")
        .style("stroke", function (d) { return d3.rgb(colors(d.target.index)).darker(); })
        .style("fill", function (d) { return colors(d.target.index); })
        .style("opacity", 0.8)
        .attr("d", path)
        .attr("transform", "translate(" + (size[0] / 2) + "," + (size[1] / 2) + ")");

      chords.transition().duration(1500)
        .attrTween("d", chordPrvdr.chordTween(path, cached));

      chords.exit().remove();

      function mouseover(d, i) {
        chords.style("opacity", function (p) {
          var cond = p.source.index != i && p.target.index != i;
          return cond ? 0.1: 0.9;
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





