var svgArray = {};
var pointsValues = [];
var width = 1200,
    height = 800;
var maxValue;
var color = d3.scaleOrdinal(d3.schemeCategory20);

var quantile;

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)

var partition = d3.partition()
    .size([height, width])
    .round(true);

var format = d3.format(",d");

d3.tsv("nba-hierarchy-ready.txt", function (error, root) {
    if (error) throw error;

    root = d3.stratify()
        .id(function (d) { return d.Player; })
        .parentId(function (d) { return d.Team; })
        (root);

    var vals = [];
    root = d3.hierarchy(root)
        .sum(function (d) { if (d.data.Points) vals.push(d.data.Points); return d.data.Points; })
        .sort(function (a, b) { return b.value - a.value; });

    quantile = makeQuantileScale(vals);

    partition(root);
    svgArray = { nodes: root.descendants(), values: vals };
    maxValue = vals.sort(function (a, b) { return b - a; })[0];

    var cell = svg
        .selectAll(".node")
        .data(root.descendants())
        .enter().append("g")
        .attr("class", function (d) { return escapeString(d.data.id) + " node" + (d.children ? " node--internal" : " node--leaf parent-" + escapeString(d.parent.data.id)); })
        .attr("transform", function (d) { return "translate(" + d.y0 + "," + d.x0 + ")"; });

    cell.append("rect")
        .attr("id", function (d) { return "rect-" + escapeString(d.data.id); })
        .attr("width", function (d) { return d.children ? d.y1 - d.y0 : (d.y1 - d.y0) * d.value / maxValue; })
        .attr("height", function (d) { return d.x1 - d.x0; })
        .filter(function (d) {
            return d.depth > 3;
        })
        .style("fill", function (d) {
            return quantile(d.data.data.Points);
        });

    cell.append("clipPath")
        .attr("id", function (d) { return "clip-" + escapeString(d.data.id); })
        .append("use")
        .attr("xlink:href", function (d) { return "#rect-" + escapeString(d.data.id) + ""; });

    cell.append("text")
        .attr("clip-path", function (d) { return "url(#clip-" + escapeString(d.data.id) + ")"; })
        .attr("x", 4)
        .selectAll("tspan")
        .data(function (d) { return d.data.children ? d.data.id : ""; }) // Ne pas afficher le nom des joueurs (illisible)
        .enter().append("tspan")
        .attr("y", 13)
        .text(function (d) { return d; });

    cell.append("title")
        .text(function (d) { return d.data.id + "\n" + format(d.value) + " points"; });
});

/////////////////////////////////////////


function makeQuantileScale(values) {
    return d3.scaleQuantile()
        .domain(values)
        .range(["#5e4fa2", "#3288bd", "#66c2a5", "#abdda4", "#e6f598", "#fee08b", "#fdae61", "#f46d43", "#d53e4f", "#9e0142"])
}

function ghostLow() { // 1892 is the limit to use to highlight 10 best points
    svgArray.nodes
        .filter(function (d) { return d.data.data.Points < 1892 && d.depth === 4; }) // Hide all the circles below the limit
        .forEach(function (d, i) {
            d3.selectAll(".parent-" + escapeString(d.parent.data.id) + "." + escapeString(d.data.id))
                .classed("ghost", true);
        }
        );
}

function unghostAll() {
    d3.selectAll(".ghost").classed("ghost", false);
}

function toggleLabels() {
    if (showLabel) {
        showLabel = false;
        d3.selectAll(".label").classed("hidden-labels", true);
    } else {
        showLabel = true;
        d3.selectAll(".label.hidden-labels").classed("hidden-labels", false);
    }
}

function escapeString(str) {
    return str.replace(/[^a-zA-Z]/g, '_')
}


function changeAttribute(selector) {
    var attribute = selector.value;
    svgArray.values = [];
    svgArray.nodes.forEach(function (d, i) {
        svgArray.values.push(d.data.data[attribute]);
        d.value = d.data.data[attribute];
    })
    maxValue = svgArray.values.sort(function (a, b) { return b - a; })[0];
    console.log(maxValue);
    var quantile = makeQuantileScale(svgArray.values);
    svgArray.nodes.filter(function (d) { return !d.children; }).forEach(function (d, i) {
        d3.select(".parent-" + escapeString(d.parent.data.id) + "." + escapeString(d.data.id) + " > rect")
            .attr("style", null)
            .style("fill", quantile(d.value))
            .attr("width", function (d) { return d.children ? d.y1 - d.y0 : (d.y1 - d.y0) * d.value / maxValue; })

    });
}