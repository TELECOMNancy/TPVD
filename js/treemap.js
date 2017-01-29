var svg = d3.select("svg.graph"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

var root;
var cells;
var quantile = false;
var points = [];
var values = [];
var fader = function (color) { return d3.interpolateRgb(color, "#fff")(0.2); },
    color = d3.scaleOrdinal(d3.schemeCategory20.map(fader)),
    format = d3.format(",d");

var treemap = d3.treemap()
    .tile(d3.treemapResquarify)
    .size([width, height])
    .round(true)
    .paddingInner(1)
    .padding(1);

d3.tsv("nba-hierarchy-ready.txt", function (error, data) {
    if (error) throw error;
    data.map(function (elem) { if (elem.Points) points.push(parseInt(elem.Points)); });

    data = d3.stratify()
        .id(function (d) { return d.Player; })
        .parentId(function (d) { return d.Team; })
        (data);

    var attribute = d3.select("#attribute-selection").node().value;

    svg.selectAll("*").remove();

    root = d3.hierarchy(data)
        .sum(function (d) {
            if (d.data.Points) values.push(parseFloat(d.data.Points));
            return d.data.Points;
        })
        .sort(function (a, b) { return b.value - a.value; });

    treemap(root);

    cells = svg.selectAll("g")
        .data(root.leaves())
        .enter().append("g")
        .attr("transform", function (d) { return "translate(" + d.x0 + "," + d.y0 + ")"; })
        .attr("id", function (d) { return "group-" + escapeString(d.data.id) + "-" + escapeString(d.parent.data.id); });

    cells.append("rect")
        .attr("id", function (d) { return "rect-" + escapeString(d.data.id) + "-" + escapeString(d.parent.data.id); })
        .attr("width", function (d) { return d.x1 - d.x0; })
        .attr("height", function (d) { return d.y1 - d.y0; })
        .attr("fill", colorTeam());

    cells.append("clipPath")
        .attr("id", function (d) { return "clip-" + escapeString(d.data.id) + "-" + escapeString(d.parent.data.id); })
        .append("use")
        .attr("xlink:href", function (d) { return "#rect-" + escapeString(d.data.id) + "-" + escapeString(d.parent.data.id); });

    cells.append("text")
        .attr("clip-path", function (d) { return "url(#clip-" + escapeString(d.data.id) + "-" + escapeString(d.parent.data.id) + ")"; })
        .selectAll("tspan")
        .data(function (d) { return d.data.data.Player.split(/(?=[A-Z][^A-Z])/g); })
        .enter().append("tspan")
        .attr("x", 4)
        .attr("y", function (d, i) { return 13 + i * 10; })
        .text(function (d) { return d; });

    cells.append("title")
        .text(function (d) { return d.data.id + "\n" + attribute + " : " + format(d.value) + "\n" + d.data.data.Points + " points\n" + d.parent.data.id; });
});

function colorQuantile() {
    var color = makeQuantileScale(values);
    return function (d) { return color(d.value) };
}

function colorTeam() {
    return function (d) { return color(d.parent.data.id); };
}

function updateTreeMap() {
    values = [];
    var attribute = d3.select("#attribute-selection").node().value;
    treemap(root.sum(
        function (d) {
            if (d.data[attribute]) values.push(d.data[attribute]);
            return parseFloat(d.data[attribute]);
        }
    ));

    var cellsTransition = cells.transition()
        .duration(750)
        .attr("transform", function (d) { return "translate(" + d.x0 + "," + d.y0 + ")"; });
    cellsTransition.select("rect")
        .attr("width", function (d) { return d.x1 - d.x0 || 0; })
        .attr("height", function (d) { return d.y1 - d.y0 || 0; })
        .attr("fill", quantile ? colorQuantile() : colorTeam());
    cellsTransition.select("title")
        .text(function (d) { return d.data.id + "\n" + attribute + " : " + format(d.value) + "\n" + d.data.data.Points + " points\n" + d.parent.data.id; });
}

function toggleColor() {
    quantile = !quantile;
    var cellsTransition = cells.transition()
        .duration(750);
    cellsTransition.select("rect").attr("fill", quantile ? colorQuantile() : colorTeam());
}

function ghostLow() { // 1892 is the limit to use to highlight 10 best points
    var tenth = points.sort(function (a, b) { return b - a; })[9];
    root.descendants()
        .filter(function (d) { return d.data.data.Points < tenth && !d.children; }) // Hide all the circles below the tenth score
        .forEach(function (d, i) {
            d3.selectAll("#group-" + escapeString(d.data.id) + "-" + escapeString(d.parent.data.id))
                .classed("ghost", true);
        }
        );
}

function makeQuantileScale(values) {
    return d3.scaleQuantile()
        .domain(values)
        .range(["#5e4fa2", "#3288bd", "#66c2a5", "#abdda4", "#e6f598", "#fee08b", "#fdae61", "#f46d43", "#d53e4f", "#9e0142"])
}

function unghostAll() {
    d3.selectAll(".ghost").classed("ghost", false);
}

function escapeString(str) {
    return str.replace(/[^a-zA-Z]/g, '_')
}