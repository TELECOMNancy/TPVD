/* Global data for the svgs */
const diameter = 300;
const margin = 4;
var svgs = {};
var views = {};
var currentlyHovered;
var showLabel = true;
/* Make a new graph based on one attribute */
function makeSVG(svgId, attribute) {
    var div = d3.select("body").append("div").attr("style", "display:inline-block;min-height: " + diameter + ", min-width:" + diameter);
    div.append("h2").text(attribute);
    var svg = div.append("svg").attr("width", diameter).attr("height", diameter).attr("id", "container-" + svgId).attr("class", "viz"),
        g = svg.append("g").attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

    var pack = d3.pack()
        .size([diameter - margin, diameter - margin])
        .padding(2);

    svgs[svgId] = {};

    d3.tsv("nba-hierarchy-ready.txt", function (error, root) {
        if (error) throw error;

        root = d3.stratify()
            .id(function (d) { return d.Player + "-" + svgId; })
            .parentId(function (d) { return d.Team ? d.Team + "-" + svgId : undefined; })
            (root);

        var values = [];
        root = d3.hierarchy(root)
            .sum(function (d) {
                if (d.data[attribute] !== undefined)
                    values.push(d.data[attribute]);
                return d.data.Points;
            })
            .sort(function (a, b) { return b.value - a.value; });

        svgs[svgId] = { focus: root, nodes: pack(root).descendants(), values: values };
        var color = makeQuantileScale(svgs[svgId].values);
        svgs[svgId].circle = g.selectAll("circle")
            .data(svgs[svgId].nodes)
            .enter().append("circle")
            .attr("id", function (d) { return d.data.id.replace(/[\s\']/g, "") })
            .attr("class", function (d) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root"; })
            .style("fill", function (d, i) { return d.data.data[attribute] !== undefined ? color(parseFloat(d.data.data[attribute])) : "#fafafa"; })
            .on("click", function (d) { if (svgs[svgId].focus !== d) zoomAll(d), d3.event.stopPropagation(); })
            .on("mouseover", function (d) {
                currentlyHovered = d.data.id.split("-")[0].replace(/[\s\']/g, "");
                d3.selectAll("circle[id^=" + currentlyHovered + "]").classed("hovered", true);
            })
            .on("mouseout", function (d) {
                d3.selectAll(".hovered").classed("hovered", false);
            });

        var text = g.selectAll("text")
            .data(svgs[svgId].nodes)
            .enter().append("text")
            .attr("class", "label")
            .style("fill-opacity", function (d) { return d.parent === root ? 1 : 0; })
            .style("display", function (d) { return d.parent === root ? "inline" : "none"; })
            .text(function (d) { return d.data.data.Player; });

        svgs[svgId].node = g.selectAll("circle,text");

        svg
            .style("background", "white")
            .on("click", function () { zoomAll(root); });

        zoomTo([root.x, root.y, root.r * 2 + margin], svgId);
    });
}

function zoomAll(d) {
    var normalizedId = d.data.id.split("-")[0].replace(/[\s\']/g, "");
    d3.selectAll("[id^=" + normalizedId + "]").each(function (d, i) { zoom(d, this); });
}

function zoom(d, elem) {
    var svgId = d.data.id.split("-")[1];
    var focus0 = svgs[svgId].focus; svgs[svgId].focus = d;

    var transition = d3.select(elem).transition()
        .duration(d3.event.altKey ? 7500 : 750)
        .tween(d.data.id, function (d) {
            var i = d3.interpolateZoom(views[svgId], [svgs[svgId].focus.x, svgs[svgId].focus.y, svgs[svgId].focus.r * 2 + margin]);
            return function (t) { zoomTo(i(t), svgId); };
        });

    d3.transition().selectAll("#container-" + svgId + " text")
        .filter(function (d) { return d.parent === svgs[svgId].focus || this.style.display === "inline"; })
        .style("fill-opacity", function (d) { return d.parent === svgs[svgId].focus ? 1 : 0; })
        .on("start", function (d) { if (d.parent === svgs[svgId].focus) this.style.display = "inline"; })
        .on("end", function (d) { if (d.parent !== svgs[svgId].focus) this.style.display = "none"; });
}

function zoomTo(v, svgId) {
    var k = diameter / v[2]; views[svgId] = v;
    svgs[svgId].node.attr("transform", function (d) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
    svgs[svgId].circle.attr("r", function (d) { return d.r * k; });
}

function makeQuantileScale(values) {
    return d3.scaleQuantile()
        .domain(values)
        .range(["#5e4fa2", "#3288bd", "#66c2a5", "#abdda4", "#e6f598", "#fee08b", "#fdae61", "#f46d43", "#d53e4f", "#9e0142"])
}

// Always keep at least Points
makeSVG("points", "Points");
makeSVG("games_played", "Games Played");
makeSVG("minutes", "Minutes");
makeSVG("field_goals_made_per_game", "Field Goals Made/Game");
makeSVG("free_throws_made","Free Throws Made");
makeSVG("two_pts_attempted_per_game","2 Points Attempted/Game");
makeSVG("two_pts_made_per_game","2 Points Made/Game");
makeSVG("turnovers","Turnovers");
makeSVG("field_goals_attempted_per_game","Field Goals Attempted/Game");
makeSVG("steals","Steals");         

function ghostLow(svgId, limit) { // 1892 is the limit to use to highlight 10 best points
    svgs[svgId].nodes
        .filter(function (d) { return d.value < limit && d.depth === 4; }) // Hide all the circles below the limit
        .forEach(function (d, index) {
            var commonPartOfId = d.data.id.replace(/[\s\']/g, "").split('-')[0]; // Keep only the common part of their id between svgs
            d3.selectAll(".node--leaf[id^=" + commonPartOfId + "-]")
                .filter(function (dd) { return d.parent.value === dd.parent.value }) // eviter de cacher d'autres joueurs du même nom
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