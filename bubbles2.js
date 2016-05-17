  d3.csv('tempdata.csv', function (error, data) {

      var nightlightColors = {
          "1":"#fff7bc",
          "2":"#fee391",
          "3":"#fec44f",
          "4":"#fee0d2",
          "5":"#fc9272",
          "6":"#de2d26",
          "7":"#deebf7",
          "8":"#9ecae1",
          "9":"#3182bd",
      }
      var cityNameColors = {
"San Jose":"#ccd29f",
"Orlando":"#68a0c5",
"Milwaukee":"#cad848",
"Washington":"#567e69",
"Denver":"#72db5b",
"Chicago":"#d07b38",
"Pittsburg":"#72d8b9",
"Portland":"#cea946",
"Las Vegas":"#609745",
"Los Angeles":"#8c723d"
      }
    var width = 1000, height = 1000;
    var fill = d3.scale.ordinal().range(['#827d92','#827354','#523536','#72856a','#2a3285','#383435'])
    var svg = d3.select("#map").append("svg")
        .attr("width", width)
        .attr("height", height);

    for (var j = 0; j < data.length; j++) {
      data[j].radius = +data[j].value / 3;
      data[j].x = Math.random() * width;
      data[j].y = Math.random() * height;
    }
    console.log(data)
    var padding = 2;
    var maxRadius = d3.max(_.pluck(data, 'radius'));

    var getCenters = function (vname, size) {
      var centers, map;
      centers = _.uniq(_.pluck(data, vname)).map(function (d) {
          return {name: d, value: 1};
      });

      map = d3.layout.treemap().size(size).ratio(1/1);
      map.nodes({children: centers});

      return centers;
    };

    var nodes = svg.selectAll("circle")
      .data(data);

    nodes.enter().append("circle")
      .attr("class", "node")
      .attr("cx", function (d) {return d.x; })
      .attr("cy", function (d) { return d.y; })
      .attr("r", function (d) { return d.radius; })
      .style("fill", function (d) {
          return nightlightColors[d.group]; })
      .on("mouseover", function (d) { showPopover.call(this, d); })
      .on("mouseout", function (d) { removePopovers(); })

    var force = d3.layout.force();

    draw('make');

    $( ".btn" ).click(function() {
      draw(this.id);
    });

    function draw (varname) {
      var centers = getCenters(varname, [1000, 1000]);
      force.on("tick", tick(centers, varname));
      labels(centers)
      force.start();
      if(varname == "name"){
          d3.selectAll("circle").transition().duration(1000).style("fill",function(d){
             return nightlightColors[d.group]; })
      }
      else{
          d3.selectAll("circle").transition().duration(1000).style("fill",function(d){
              return cityNameColors[d.name]})
              
      }
      
    }

    function tick (centers, varname) {
      var foci = {};
      for (var i = 0; i < centers.length; i++) {
        foci[centers[i].name] = centers[i];
      }
      return function (e) {
        for (var i = 0; i < data.length; i++) {
          var o = data[i];
          var f = foci[o[varname]];
          o.y += ((f.y + (f.dy / 2)) - o.y) * e.alpha;
          o.x += ((f.x + (f.dx / 2)) - o.x) * e.alpha;
        }
        nodes.each(collide(.11))
          .attr("cx", function (d) { return d.x; })
          .attr("cy", function (d) { return d.y; });
      }
    }

    function labels (centers) {
      svg.selectAll(".label").remove();
      svg.selectAll(".label")
      .data(centers).enter().append("text")
      .attr("class", "label")
      .text(function (d) { return d.name })
      .attr("transform", function (d) {
        return "translate(" + (d.x + (d.dx / 2)) + ", " + (d.y + 20) + ")";
      });
    }

    function removePopovers () {
      $('.popover').each(function() {
        $(this).remove();
      }); 
    }

    function showPopover (d) {
        console.log(d)
      $(this).popover({
        placement: 'auto top',
        container: 'body',
        trigger: 'manual',
        html : true,
        content: function() { 
          return "City: " + d.name + "<br/>Value: " + d.value + 
                 "<br/>Group: " + d.group; 
        }
      });
      $(this).popover('show')
    }

    function collide(alpha) {
      var quadtree = d3.geom.quadtree(data);
      return function (d) {
        var r = d.radius + maxRadius + padding,
            nx1 = d.x - r,
            nx2 = d.x + r,
            ny1 = d.y - r,
            ny2 = d.y + r;
        quadtree.visit(function(quad, x1, y1, x2, y2) {
          if (quad.point && (quad.point !== d)) {
            var x = d.x - quad.point.x,
                y = d.y - quad.point.y,
                l = Math.sqrt(x * x + y * y),
                r = d.radius + quad.point.radius + padding;
            if (l < r) {
              l = (l - r) / l * alpha;
              d.x -= x *= l;
              d.y -= y *= l;
              quad.point.x += x;
              quad.point.y += y;
            }
          }
          return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
        });
      };
    }
  });
