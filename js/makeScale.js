  /* BEGIN Scale */
        var legendSvg = d3.select('#scale-svg')
            .attr('width', 400)
            .attr('height', 40)
            .append('g')

        legendSvg.append('rect')
            .attr('width', 280)
            .attr('height', 15)
            .attr("transform", "translate(10,0)")
            .style('fill', 'url(#gradientScale)');

        var legendScale = d3.scaleLinear()
            .domain([0, 100])
            .range([0, 280]);

        var legendAxis = d3.axisBottom()
            .scale(legendScale)
            .tickValues(d3.range(0, 100, 10))
            .tickFormat(d3.format("d"));

        legendSvg.append("g")
            .attr("class", "legend axis")
            .attr("transform", "translate(10,15)")
            .call(legendAxis);

        var gradient = legendSvg.append('defs')
            .append('linearGradient')
            .attr('id', 'gradientScale')
            .attr('x1', '0%') // left
            .attr('y1', '0%')
            .attr('x2', '100%') // to right
            .attr('y2', '0%')
            .attr('spreadMethod', 'pad');


        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#5e4fa2")
            .attr("stop-opacity", 1);
        gradient.append("stop")
            .attr("offset", "10%")
            .attr("stop-color", "#5e4fa2")
            .attr("stop-opacity", 1);
        gradient.append("stop")
            .attr("offset", "10%")
            .attr("stop-color", "#3388bd")
            .attr("stop-opacity", 1);
        gradient.append("stop")
            .attr("offset", "20%")
            .attr("stop-color", "#3388bd")
            .attr("stop-opacity", 1);
        gradient.append("stop")
            .attr("offset", "20%")
            .attr("stop-color", "#66c2a5")
            .attr("stop-opacity", 1);
        gradient.append("stop")
            .attr("offset", "30%")
            .attr("stop-color", "#66c2a5")
            .attr("stop-opacity", 1);
        gradient.append("stop")
            .attr("offset", "30%")
            .attr("stop-color", "#abdda4")
            .attr("stop-opacity", 1);
        gradient.append("stop")
            .attr("offset", "40%")
            .attr("stop-color", "#abdda4")
            .attr("stop-opacity", 1);
        gradient.append("stop")
            .attr("offset", "40%")
            .attr("stop-color", "#e6f598")
            .attr("stop-opacity", 1);
        gradient.append("stop")
            .attr("offset", "50%")
            .attr("stop-color", "#e6f598")
            .attr("stop-opacity", 1);
        gradient.append("stop")
            .attr("offset", "50%")
            .attr("stop-color", "#fee08b")
            .attr("stop-opacity", 1);
        gradient.append("stop")
            .attr("offset", "60%")
            .attr("stop-color", "#fee08b")
            .attr("stop-opacity", 1);
        gradient.append("stop")
            .attr("offset", "60%")
            .attr("stop-color", "#fdae61")
            .attr("stop-opacity", 1);
        gradient.append("stop")
            .attr("offset", "70%")
            .attr("stop-color", "#fdae61")
            .attr("stop-opacity", 1);
        gradient.append("stop")
            .attr("offset", "70%")
            .attr("stop-color", "#f46d43")
            .attr("stop-opacity", 1);
        gradient.append("stop")
            .attr("offset", "80%")
            .attr("stop-color", "#f46d43")
            .attr("stop-opacity", 1);
        gradient.append("stop")
            .attr("offset", "80%")
            .attr("stop-color", "#d53e4f")
            .attr("stop-opacity", 1);
        gradient.append("stop")
            .attr("offset", "90%")
            .attr("stop-color", "#d53e4f")
            .attr("stop-opacity", 1);
        gradient.append("stop")
            .attr("offset", "90%")
            .attr("stop-color", "#9e0142")
            .attr("stop-opacity", 1);
        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#9e0142")
            .attr("stop-opacity", 1);
        /* END scale */