$(function() {
	queue()
		.defer(d3.csv, "data/MSAs_NightLights_format2.csv")
//		.defer(d3.json,"data/boston_buildings.geojson")
		.await(dataDidLoad);
})
var width = 1200,
    height = 1200,
    padding = 0, // separation between same-color nodes
    clusterPadding = 40, // separation between different-color nodes
    maxRadius = 60;
    minRadius = 20;
$("#topDifferences .hideTop").hide()

function dataDidLoad(error,data) {
//make 1 svg for everything
    initiateBubbles(data)
//    drawBuildings(buildings,mapSvg)
//    drawDots(dots,mapSvg)
}
var nightlightColors = {
    "1":"#fef1cf",
    "2":"#fee4a0",
    "3":"#fdd673",
    "4":"#fccccd",
    "5":"#fa999b",
    "6":"#f97d82",
    "7":"#deebf6",
    "8":"#deebf6",
    "9":"#9ec3e4",
}
function initiateBubbles(data){
    console.log(data)
    m = d3.max(data, function(d){return d.group});
    console.log(m)
     //create teh color categories
    color = d3.scale.category10().domain(d3.range(m));
     //make teh clusters array each cluster for each group
     clusters = new Array(m);
     dataset = data.map(function(d) {
       //find teh radius intered in the csv
         var rScale = d3.scale.linear().domain([0,100]).range([minRadius,maxRadius])
     var r = rScale(parseFloat(d.value));
       var dta = {
         cluster: d.group,//group
         name: d.city,//label
         radius: r,//radius
         x: Math.cos(d.group / m * 2 * Math.PI) * 100 + width / 2 + Math.random(),
         y: Math.sin(d.group / m * 2 * Math.PI) * 100 + height / 2 + Math.random()
       };
       //add the one off the node inside teh cluster
       if (!clusters[d.group] || (d.radius > clusters[d.group].value)) clusters[d.group] = dta;
       return dta;
     });
     //after mapping use that t make the graph
     makeGraph(dataset);
}
function makeGraph(nodes) {
  var force = d3.layout.force()
    .nodes(nodes)
    .size([width, height])
    .gravity(.02)
    .charge(0)
    .on("tick", tick)
    .start();

  var svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);

  var node = svg.selectAll("circle")
    .data(nodes)
    .enter().append("g").call(force.drag);
  //addcircle to the group
  node.append("circle")
    .style("fill", function(d) {
        return nightlightColors[d.cluster]
    }).attr("r", function(d) {
      return d.radius
    })
    .attr("opacity",0)
    .attr("class",function(d){return d.name + " "+d.group})
    .transition()
    .delay(function(d,i){return i*10})
    .duration(1000)
    .attr("opacity",1)
    
    //add text to the group    
  node.append("text")
    .text(function(d) {
      return d.name;
    })
    .attr("dx", 0)
    .attr("dy", ".35em")
    .attr("text-anchor","middle")
    .text(function(d) {
      return d.name
    })
    .attr("fill","#000")
    .style("stroke", "none")
    .attr("opacity",0)
    .transition()
    .delay(function(d,i){return i*10})
    .duration(1000)
    .attr("opacity",1)

function tick(e) {
    node.each(cluster(10 * e.alpha * e.alpha))
      .each(collide(.5))
      //.attr("transform", functon(d) {});
      .attr("transform", function(d) {
        var k = "translate(" + d.x + "," + d.y + ")";
        return k;
      })

  }

  // Move d to be adjacent to the cluster node.
function cluster(alpha) {
    return function(d) {
      var cluster = clusters[d.cluster];
      if (cluster === d) return;
      var x = d.x - cluster.x,
        y = d.y - cluster.y,
        l = Math.sqrt(x * x + y * y),
        r = d.radius + cluster.radius;
      if (l != r) {
        l = (l - r) / l * alpha;
        d.x -= x *= l;
        d.y -= y *= l;
        cluster.x += x;
        cluster.y += y;
      }
    };
  }

  // Resolves collisions between d and all other circles.
function collide(alpha) {
    var quadtree = d3.geom.quadtree(nodes);
    return function(d) {
      var r = d.radius + maxRadius + Math.max(padding, clusterPadding),
        nx1 = d.x - r,
        nx2 = d.x + r,
        ny1 = d.y - r,
        ny2 = d.y + r;
      quadtree.visit(function(quad, x1, y1, x2, y2) {
        if (quad.point && (quad.point !== d)) {
          var x = d.x - quad.point.x,
            y = d.y - quad.point.y,
            l = Math.sqrt(x * x + y * y),
            r = d.radius + quad.point.radius + (d.cluster === quad.point.cluster ? padding : clusterPadding);
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
}
function drawBuildings(geoData,svg){
    //need to generalize projection into global var later
	var projection = d3.geo.mercator().scale(4000000).center([-71.063,42.3562])
    //d3 geo path uses projections, it is similar to regular paths in line graphs
	var path = d3.geo.path().projection(projection);
    
    //push data, add path
	svg.selectAll(".buildings")
		.data(geoData.features)
        .enter()
        .append("path")
		.attr("class","buildings")
		.attr("d",path)
		.style("fill","#aaa")
	    .style("opacity",.5)
}
function drawDots(data,svg){
	var projection = d3.geo.mercator().scale(4000000).center([-71.063,42.3562])
    
    svg.selectAll(".dots")
        .data(data)
        .enter()
        .append("circle")
        .attr("class","dots")
        .attr("r",2)
        .attr("cx",function(d){
            var lat = parseFloat(d.latitude)
            var lng = parseFloat(d.longitude)
            //to get projected dot position, use this basic formula
            var projectedLng = projection([lng,lat])[0]
            return projectedLng
        })
        .attr("cy",function(d){
            var lat = parseFloat(d.latitude)
            var lng = parseFloat(d.longitude)
            var projectedLat = projection([lng,lat])[1]
            return projectedLat
        })
        .attr("fill",function(d){
            //color code the dots by gender
            var gender = d.gender
            if(gender == "F"){
                return "red"
            }else if(gender == "M"){
                return "blue"
            }else{
                return "black"
            }            
        })
	    .style("opacity",.3)
        //on mouseover prints dot data
        .on("mouseover",function(d){
            console.log(d)
        })
        
}