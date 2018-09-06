// draw dependency tree on webpage 
function generateGraph() {
  var canvas = d3.select("body").append("svg")
      .attr("width", 1900)
      .attr("height", 1000)
      .append("g")
      .attr("transform", "translate(50, 50)");


  var tree = d3.layout.tree()
      .size([900, 900]);

  // read json data from file and create nodes/links
  d3.json("treeData.json", function(data) {
      var nodes = tree.nodes(data);
      var links = tree.links(nodes);

      var node = canvas.selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", function(d) { // decide location for node in canvas
          return "translate(" + d.y + "," + d.x + ")";
        }) 
    // create dot(circle) for node
    node.append("circle")
      .attr("r",  function(d) { return d.children ? 10 : 4; })
      .attr("fill", function(d) { return d.children ? "red" : "steelblue"; });

    // append package name, version to node
    node.append("text")
	  .attr("dx", function(d) { return d.children ? -10 : 10; })
	  .attr("dy", function(d) { return d.children ? -15 : 5; })
      .text(function(d) {
        return d.name + "[" + d.version + "]";
      })
	// append dependency type to root node.  
	node.append("text")
	  .attr("dx", function(d) { return d.children ? -10 : 0; })
	  .attr("dy", function(d) { return d.children ? 25 : 0; })
      .text(function(d) {
	  return d.children ? d.depType : "";
      })
	  
    // connect root and dependent 
    var diagonal = d3.svg.diagonal()
      .projection(function(d) {
        return [d.y, d.x];  // provide source and target point for diagonal
      });

    canvas.selectAll(".link")
      .data(links)
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#ADADAD")
      .attr("d", diagonal);
    })
}