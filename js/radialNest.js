var svg = {};
var pointsValues = [];
var maxValue;
var currentlyHovered;
var svgElem = d3.select("svg.graph"),
    width = +svgElem.attr("width"),
    height = +svgElem.attr("height"),
    g = svgElem.append("g").attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");

var tree = d3.tree()
    .size([360, 480])
    .separation(function (a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });


d3.tsv("nba-no-hierarchy.txt", function (error, data) {
    if (error) throw error;


    data = makeNest(data, [
        {
            attribute: "Games Played",
            classes: ["top", "low"]
        },
        {
            attribute: "Minutes/Game",
            classes: ["top", "low"]
        },
        {
            attribute: "Turnovers/Game",
            classes: ["top", "low"]
        },
        {
            attribute: "2 Points Made/Game",
            classes: ["top", "low"]
        },
        {
            attribute: "Assists/Game",
            classes: ["top", "low"]
        },
        {
            attribute: "Minutes",
            classes: ["top", "low"]
        },
        {
            attribute: "Field Goals Attempted/Game",
            classes: ["top", "low"]
        },
        {
            attribute: "Steals",
            classes: ["top", "low"]
        },
    ]);

    data = { key: "nba", values: data };


    pointsValues = [];
    var root = d3.hierarchy(data, function (d) {
        return d.values;
    })
        .sum(function (d) { if (d.Points) pointsValues.push(parseInt(d.Points)); return d.Points; })
        .sort(function (a, b) { return b.value - a.value; });

    quantile = makeQuantileScale(pointsValues);

    root = tree(root);

    svg = { values: pointsValues, nodes: root.descendants() };
    var sortedValues = pointsValues.sort(function (a, b) { return b - a; }).slice(0, 10);
    maxValue = sortedValues[0];

    var link = g.selectAll(".link")
        .data(root.descendants().slice(1))
        .enter().append("path")
        .attr("class", function (d) { return "link " + escapeString(d.parent.data.key) + "-" + escapeString(d.data.key || d.data.Player) + (d.data.key ? " " + d.data.key.slice(0, 3) : "") })
        .attr("d", function (d) {
            return "M" + project(d.x, d.y)
                + "C" + project(d.x, (d.y + d.parent.y) / 2)
                + " " + project(d.parent.x, (d.y + d.parent.y) / 2)
                + " " + project(d.parent.x, d.parent.y);
        });

    var node = g.selectAll(".node")
        .data(root.descendants())
        .enter().append("g")
        .attr("class", function (d) { return escapeString(d.data.key || d.data.Player) + " node" + (d.children ? " node--internal" : " node--leaf parent-" + escapeString(d.parent.data.key)); })
        .attr("transform", function (d) { return "translate(" + project(d.x, d.y) + ")"; });

    node.append("circle")
        .attr("r", function (d) { return 3; })
        .style("fill", function (d) { return d.children ? undefined : quantile(d.value); })
        .on("mouseover", function (d) {
            currentlyHovered = d.data.key;
            d3.selectAll(".node--internal." + currentlyHovered + " circle").classed("hovered", true);
        })
        .on("mouseout", function (d) {
            d3.selectAll(".hovered").classed("hovered", false);
        });

    node.append("text")
        .attr("dy", ".31em")
        .attr("x", function (d) { return d.x < 180 === !d.children ? 6 : -6; })
        .style("text-anchor", function (d) { return d.x < 180 === !d.children ? "start" : "end"; })
        .attr("transform", function (d) { return "rotate(" + (d.x < 180 ? d.x - 90 : d.x + 90) + ")"; })
        .text(function (d) {
            var label = '';
            var idx;
            if (idx = sortedValues.indexOf(d.value) + 1) {
                label = idx;
            }
            return label
        });

    node.append("title")
        .text(function (d) {
            if (d.data.key) return d.data.key.replace(/_/g, " ");
            else return (d.data.Player + "\n" + d.value + " points");
        });
});

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
        d3.select("p.structure").append("span").text(attribute);
    })

    return nest.entries(data);
}

function project(x, y) {
    var angle = (x - 90) / 180 * Math.PI, radius = y;
    return [radius * Math.cos(angle), radius * Math.sin(angle)];
}

function makeQuantileScale(values) {
    return d3.scaleQuantile()
        .domain(values)
        .range(["#5e4fa2", "#3288bd", "#66c2a5", "#abdda4", "#e6f598", "#fee08b", "#fdae61", "#f46d43", "#d53e4f", "#9e0142"])
}

function escapeString(str) {
    return str.replace(/[^a-zA-Z]/g, '_');
}