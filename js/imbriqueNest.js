/* Global data for the svgs */
const diameter = 800;
const margin = 4;
var svgData = {};
var view;
var currentlyHovered;
var showLabel = true;

var div = d3.select("body").append("div").attr("style", "display:inline-block;min-height: " + diameter + ", min-width:" + diameter);
div.append("h2").text("Points");
var svg = div.append("svg").attr("width", diameter).attr("height", diameter).attr("class", "viz"),
    g = svg.append("g").attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

var pack = d3.pack()
    .size([diameter - margin, diameter - margin])
    .padding(2);
d3.tsv("nba-no-hierarchy.txt", function (error, data) {
    if (error) throw error;

    data = makeNest(data, [
        {
            attribute: "Field Goals Made/Game",
            classes: ["top", "topmed", "lowmed", "low"]
        },
        {
            attribute: "Free Throws Made",
            classes: ["top", "topmed", "lowmed", "low"]
        },
        {
            attribute: "2 Points Attempted/Game",
            classes: ["top", "topmed", "lowmed", "low"]
        },
        {
            attribute: "2 Points Made/Game",
            classes: ["top", "topmed", "lowmed", "low"]
        },
        {
            attribute: "Turnovers",
            classes: ["top", "topmed", "lowmed", "low"]
        },
        {
            attribute: "Minutes",
            classes: ["top", "topmed", "lowmed", "low"]
        },
        {
            attribute: "Field Goals Attempted/Game",
            classes: ["top", "topmed", "lowmed", "low"]
        },
        {
            attribute: "Steals",
            classes: ["top", "topmed", "lowmed", "low"]
        },
    ]);

    
    data = { key: "nba", values: data };

    pointsValues = [];
    var root = d3.hierarchy(data, function (d) {
        return d.values;
    })
        .sum(function (d) { if (d.Points) pointsValues.push(parseInt(d.Points)); return d.Points; })
        .sort(function (a, b) { return b.value - a.value; });

    svgData = { focus: root, nodes: pack(root).descendants(), values: pointsValues };
    var color = makeQuantileScale(svgData.values);
    svgData.circle = g.selectAll("circle")
        .data(svgData.nodes)
        .enter().append("circle")
        .attr("class", function (d) { return d.parent ? d.children ? "node " + d.data.key : "node node--leaf " + escapeString(d.data.Player) : "node node--root"; })
        .style("fill", function (d, i) { return !d.children ? color(parseInt(d.data["Points"])) : "#fafafa"; })
        .on("click", function (d) { if (svgData.focus !== d) zoom(d), d3.event.stopPropagation(); })
        .on("mouseover", function (d) {
            currentlyHovered = d.data.key;
            d3.selectAll("circle." + currentlyHovered).classed("hovered", true);
        })
        .on("mouseout", function (d) {
            d3.selectAll(".hovered").classed("hovered", false);
        });

    svgData.circle.append("title")
        .text(function (d) { return d.data.key ? d.data.key.replace(/_/g, " ") : ''; });

    var text = g.selectAll("text")
        .data(svgData.nodes)
        .enter().append("text")
        .attr("class", "label")
        .style("fill-opacity", function (d) { return d.parent === root ? 1 : 0; })
        .style("display", function (d) { return d.parent === root ? "inline" : "none"; })
        .text(function (d) { return d.data.key ? d.data.key.replace(/_/g, " ") : d.data.Player; });

    svgData.node = g.selectAll("circle,text");

    svg
        .style("background", "white")
        .on("click", function () { zoom(root); });

    zoomTo([root.x, root.y, root.r * 2 + margin]);
});

function zoom(d) {
    var focus0 = svgData.focus; svgData.focus = d;

    var transition = d3.transition()
        .duration(d3.event.altKey ? 7500 : 750)
        .tween("zoom", function (d) {
            var i = d3.interpolateZoom(view, [svgData.focus.x, svgData.focus.y, svgData.focus.r * 2 + margin]);
            return function (t) { zoomTo(i(t)); };
        });

    transition.selectAll("text")
        .filter(function (d) { return d.parent === svgData.focus || this.style.display === "inline"; })
        .style("fill-opacity", function (d) { return d.parent === svgData.focus ? 1 : 0; })
        .on("start", function (d) { if (d.parent === svgData.focus) this.style.display = "inline"; })
        .on("end", function (d) { if (d.parent !== svgData.focus) this.style.display = "none"; });
}

function zoomTo(v) {
    var k = diameter / v[2]; view = v;
    svgData.node.attr("transform", function (d) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
    svgData.circle.attr("r", function (d) { return d.r * k; });
}

function makeNest(data, structure) {
    var nest = d3.nest();

    structure.forEach(function (level, idx) {
        var classes = level.classes;
        var nbOfClass = classes.length;
        var attribute = level.attribute;

        var attributeData = data.map(function (d) { return parseFloat(d[attribute]); }).sort(function (a, b) { return a - b; });
        var classSize = 1 / nbOfClass;
        var steps = [];
        for (i = 0; i < nbOfClass; i++) {
            steps.push(d3.quantile(attributeData, 1 - i * classSize));
        }

        nest = nest.key(function (d) {
            var attributedClass = undefined;
            steps.forEach(function (step, idx) {
                if (parseFloat(d[attribute]) <= step) {
                    attributedClass = classes[idx] + "_" + escapeString(attribute);
                }
            });
            return attributedClass;
        });
        d3.select("p.structure").append("span").text(attribute + " (" + nbOfClass + " groupes)");
    })

    return nest.entries(data);
}

function makeQuantileScale(values) {
    return d3.scaleQuantile()
        .domain(values)
        .range(["#5e4fa2", "#3288bd", "#66c2a5", "#abdda4", "#e6f598", "#fee08b", "#fdae61", "#f46d43", "#d53e4f", "#9e0142"])
}

function ghostLow(svgId, limit) { // 1892 is the limit to use to highlight 10 best points
    svgData.nodes
        .filter(function (d) { return d.value < limit && d.data.Player; }) // Hide all the circles below the limit
        .forEach(function (d, index) {
            d3.selectAll(".node--leaf." + escapeString(d.data.Player))
                .filter(function (dd) { ;return d.data.Points === dd.data.Points }) // eviter de cacher d'autres joueurs du même nom
                .classed("ghost", true);
        });
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