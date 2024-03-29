var focusedAttr = "Points";
var values = {};

var margin = { top: 30, right: 10, bottom: 10, left: 10 },
    width = 3000 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

var x = d3.scale.ordinal().rangePoints([0, width], 1),
    y = {},
    dragging = {};

var line = d3.svg.line(),
    axis = d3.svg.axis().orient("left"),
    background,
    foreground;
var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.csv("nba-no-hierarchy-exo2.csv", function (error, players) {

    // Extract the list of dimensions and create a scale for each.
    x.domain(dimensions = d3.keys(players[0]).filter(function (d) {
        values[d] = players.map(function (p) { return p[d] });
        if ( !(// Colonnes à afficher
        d === "Points" || 
        d === "Defensive Rebounds" || 
        d === "Field Goals Attempted/Game" || 
        d === "Steals" || 
        d === "Turnovers" || 
        d === "Minutes" || 
        d === "Field Goals Attempted" || 
        d === "Points/Game" || 
        d === "Field Goals Made" || 
        d === "2 Points Attempted" || 
        d === "2 Points Made" || 
        d === "2 Points Attempted/Game" || 
        d === "2 Points Made/Game" || 
        d === "Free Throws Made" || 
        d === "Free Throws Attempted" || 
        d === "Field Goals Made/Game"|| 
        d === "Assists" || 
        d === "Games Started" || 
        d === "Games Played " || 
        d === "Personal Fouls" || 
        d === "Total Rebounds" || 
        d === "Free Throws Made/Game" || 
        d === "Free Throws Attempted/Game" || 
        d === "Minutes/Game" || 
        d === "Offensive"
        )) return false;
        if (false) { // Colonnes catégorielles
            y[d] = d3.scale.ordinal()
                .domain(players.map(function (p) { return p[d]; }))
                .rangePoints([height, 0]);
        }
        else if (false) { // Colonnes numériques inversées
            y[d] = d3.scale.linear()
                .domain(d3.extent(players, function (p) { return +p[d]; }))
                .range([0, height]);
        } else { // Colonnes numériques
            y[d] = d3.scale.linear()
                .domain(d3.extent(players, function (p) { return +p[d]; }))
                .range([height, 0]);
        }
        return true;
    }));

    var color = makeQuantileScale(values[focusedAttr]);

    // Add grey background lines for context.
    background = svg.append("g")
        .attr("class", "background")
        .selectAll("path")
        .data(players)
        .enter().append("path")
        .attr("d", path);

    // Add blue foreground lines for focus.
    foreground = svg.append("g")
        .attr("class", "foreground")
        .selectAll("path")
        .data(players)
        .enter().append("path")
        .attr("d", path)
        .style("stroke", function (d) { return color(d[focusedAttr]); });

    // Add a group element for each dimension.
    var g = svg.selectAll(".dimension")
        .data(dimensions)
        .enter().append("g")
        .attr("class", "dimension")
        .attr("transform", function (d) { return "translate(" + x(d) + ")"; })
        .call(d3.behavior.drag()
            .origin(function (d) { return { x: x(d) }; })
            .on("dragstart", function (d) {
                dragging[d] = x(d);
                background.attr("visibility", "hidden");
            })
            .on("drag", function (d) {
                dragging[d] = Math.min(width, Math.max(0, d3.event.x));
                foreground.attr("d", path);
                dimensions.sort(function (a, b) { return position(a) - position(b); });
                x.domain(dimensions);
                g.attr("transform", function (d) { return "translate(" + position(d) + ")"; })
            })
            .on("dragend", function (d) {
                delete dragging[d];
                transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
                transition(foreground).attr("d", path);
                background
                    .attr("d", path)
                    .transition()
                    .delay(500)
                    .duration(0)
                    .attr("visibility", null);
            }));

    // Add an axis and title.
    g.append("g")
        .attr("class", "axis")
        .each(function (d) { d3.select(this).call(axis.scale(y[d])); })
        .append("text")
        .style("text-anchor", "middle")
        .attr("y", -9)
        .text(function (d) { return d; });

    // Add and store a brush for each axis.
    g.append("g")
        .attr("class", "brush")
        .each(function (d) {
            d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brushstart", brushstart).on("brush", brush));
        })
        .selectAll("rect")
        .attr("x", -8)
        .attr("width", 16);
});

function position(d) {
    var v = dragging[d];
    return v == null ? x(d) : v;
}

function transition(g) {
    return g.transition().duration(500);
}

// Returns the path for a given data point.
function path(d) {
    return line(dimensions.map(function (p) { return [position(p), y[p](d[p])]; }));
}

function brushstart() {
    d3.event.sourceEvent.stopPropagation();
}

// Handles a brush event, toggling the display of foreground lines.
function brush() {
    var actives = dimensions.filter(function (p) { return !y[p].brush.empty(); }),
        extents = actives.map(function (p) { return y[p].brush.extent(); });
    foreground.style("display", function (d) {
        return actives.every(function (p, i) {
            return extents[i][0] <= d[p] && d[p] <= extents[i][1];
        }) ? null : "none";
    });
}

function makeQuantileScale(values) {
    return d3.scale.quantile()
        .domain(values)
        .range(["#5e4fa2", "#3288bd", "#66c2a5", "#abdda4", "#e6f598", "#fee08b", "#fdae61", "#f46d43", "#d53e4f", "#9e0142"])
}

function changeAttribute(selector) {
    focusedAttr = selector.value;

    var quantile = makeQuantileScale(values[focusedAttr]);

    d3.selectAll(".foreground path")
        .style("stroke", function (d) { return quantile(d[focusedAttr]); });
}