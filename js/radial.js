var svg = {};
var pointsValues = {};
var maxValue;
var svgElem = d3.select("svg.graph"),
    width = +svgElem.attr("width"),
    height = +svgElem.attr("height"),
    g = svgElem.append("g").attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");

var tree = d3.tree()
    .size([360, 680])
    .separation(function (a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });

d3.tsv("nba-hierarchy-ready.txt", function (error, root) {
    if (error) throw error;

    root = d3.stratify()
        .id(function (d) { return d.Player; })
        .parentId(function (d) { return d.Team; })
        (root);
    var values = [];
    root = d3.hierarchy(root)
        .sum(function (d) {
            if (d.data.Points !== undefined)
                values.push(d.data.Points);
            return d.data.Points;
        })
        .sort(function (a, b) { return b.value - a.value; });
    var color = makeQuantileScale(values);
    root = tree(root);

    svg = { values: values, nodes: root.descendants() };
    pointsValues = values;

    maxValue = pointsValues.sort(function (a, b) { return b - a; })[0];

    var link = g.selectAll(".link")
        .data(root.descendants().slice(1))
        .enter().append("path")
        .attr("class", function (d) { return "link " + escapeString(d.parent.data.id) + "-" + escapeString(d.data.id) })
        .attr("d", function (d) {
            return "M" + project(d.x, d.y)
                + "C" + project(d.x, (d.y + d.parent.y) / 2)
                + " " + project(d.parent.x, (d.y + d.parent.y) / 2)
                + " " + project(d.parent.x, d.parent.y);
        });

    var node = g.selectAll(".node")
        .data(root.descendants())
        .enter().append("g")
        .attr("class", function (d) { return escapeString(d.data.id) + " node" + (d.children ? " node--internal" : " node--leaf parent-" + escapeString(d.parent.data.id)); })
        .attr("transform", function (d) { return "translate(" + project(d.x, d.y) + ")"; });

    node.append("circle")
        .attr("r", function (d) { return d.children ? 3 : 8 * (d.value / maxValue); })
        .style("fill", function (d) { return d.children ? undefined : color(d.value); });

    node.append("text")
        .attr("dy", ".31em")
        .attr("x", function (d) { return d.x < 180 === !d.children ? 6 : -6; })
        .style("text-anchor", function (d) { return d.x < 180 === !d.children ? "start" : "end"; })
        .attr("transform", function (d) { return "rotate(" + (d.x < 180 ? d.x - 90 : d.x + 90) + ")"; })
        .text(function (d) { return d.data.id; });
});

function ghostLow() { // 1892 is the limit to use to highlight 10 best points
    svg.nodes
        .filter(function (d) { return d.data.data.Points < 1892 && d.depth === 4; }) // Hide all the circles below the tenth score
        .forEach(function (d, i) {
            d3.selectAll(".parent-" + escapeString(d.parent.data.id) + "." + escapeString(d.data.id))
                .classed("ghost", true);
        }
        );
}

function unghostAll() {
    d3.selectAll(".ghost").classed("ghost", false);
}

function makeQuantileScale(values) {
    return d3.scaleQuantile()
        .domain(values)
        .range(["#5e4fa2", "#3288bd", "#66c2a5", "#abdda4", "#e6f598", "#fee08b", "#fdae61", "#f46d43", "#d53e4f", "#9e0142"])
}

function project(x, y) {
    var angle = (x - 90) / 180 * Math.PI, radius = y;
    return [radius * Math.cos(angle), radius * Math.sin(angle)];
}

function escapeString(str) {
    return str.replace(/[^a-zA-Z]/g, '_')
}

function changeAttribute(selector) {
    var attribute = selector.value;
    svg.values = [];
    svg.nodes.forEach(function (d, i) {
        svg.values.push(d.data.data[attribute]);
        d.value = d.data.data[attribute];
    })
    maxValue = svg.values.sort(function (a, b) { return b - a; })[0];

    var quantile = makeQuantileScale(svg.values);
    svg.nodes.filter(function (d) { return !d.children; }).forEach(function (d, i) {
        d3.select(".parent-" + escapeString(d.parent.data.id) + "." + escapeString(d.data.id) + " > circle")
            .attr("r", function (d) { return d.children ? 3 : 8 * (d.value / maxValue); })
            .attr("style", null)
            .style("fill", quantile(d.value));
    });
}