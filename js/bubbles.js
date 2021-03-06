function bubbles_chart(config){
    var margin = { left:140, right:10, top:20, bottom:120 }
    var height = config.height - margin.top - margin.bottom, 
        width = config.width - margin.left - margin.right,
        selection = config.selection,
        states_data = config.states_data,
        full2abbrev = config.full2abbrev,
        anno = config.anno,
        chart_data = [],
        nodePadding = 4.5,
        populations = config.census,
        severitySelector = config.severity;
        groupSelector = config.group,
        urban_percent = config.urban;
        timeSelector = config.dateSelector,
        political_aff = config.political_aff,
        focus = [];

    var color = d3.scaleOrdinal(d3.schemeDark2);
    var cur_color = 0;

    var max_pop = 40000000,
        min_pop = 0,
        max_urban = 100,
        min_urban = 0

    var usFirstCase = new Date(2020, 0, 21),
        usHundredCase = new Date(2020, 2, 5);

    var today = new Date();
    var radius_max = width * 0.1
        
    // append the svg object to the body of the page
    var svg = d3.select(selection)
        .append("svg")
            .attr("width", width + margin.right + margin.left)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", "translate(" + (0 + margin.left) + "," + margin.top + ")")

    var axisLabels = svg.append("g")
        .attr("class", "axis-labels")

    var axes= svg.append("g")
        .attr("class", "axis axis--y axisWhite")
    
    var grid = svg.append("g")
        .attr('class', "axes")

    //Set Scales
    var a = d3.scaleLinear()
        .range([0, radius_max])

    var yOrdinalRegion = d3.scaleBand()
        .domain(['Northeast', 'West', 'South', 'Midwest', 'Other'])
        .range([radius_max, height - radius_max])

    var yOrdinalPol = d3.scaleBand()
        .domain(["Republican", "Democratic", "Other"])
        .range(yOrdinalRegion.range())

    var yLinearPop = d3.scaleLinear()
        .range([height - radius_max, radius_max])

    var yLinearUrban = d3.scaleLinear()
        .range([height - radius_max, radius_max])


    var colorScale = d3.scaleSequential(d3.interpolateReds)
        .domain([-3,20])

    //Default to Population Sorted
    var y = yLinearPop;
    var yAxis = d3.axisLeft();
    //Setup tooltip


    svg.append('rect')
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .attr("stroke", "#fff")
        .attr("fill", "none")
        .attr("stroke-wdith", "1px")

    //Mask area for bubbles to be in
    var mask = svg.append("defs")
        .append("clipPath")
        .attr("id", "bubble-mask")
        .append("rect")
            .attr("class", "clip-rect")
            .attr('x', 0)
            .attr("y", 0)
            .attr("height", height)
            .attr("width", width)

    var masked = svg.append("g")
        .attr('clip-path', "url(#bubble-mask")

    var vis_nodes = masked.append('g').attr("class", "nodes")
    var vis_texts = masked.append("g").attr("class", "nodes-text")
        
    axisLabels.append('text')
        .attr("id", "grouping-label")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height/2)
        .attr("y", -85)
        
    var gridlines = grid.append("g")
        .attr("class", "grid")


    var legends = svg.append("g")
        .attr("class", "bubbles-legends")
        .attr("transform", "translate(0," + height + ")")


    var severityLegend = legends.append("g")
        .attr("class", "severity-legend")
        .attr("transform", "translate(" + width * 0.13 + "," + 45 + ")")

    sevR = a.range()[1]*0.7
    sevX = 15
    sevY = 15
    sevScale = severityLegend.append("circle")
        .attr("cx", sevX)
        .attr("cy", sevY)
        .attr("r", sevR)
        .attr("fill", d3.interpolateReds(0.9))
        .attr("opacity", 0.3)

    severityLegend.append("circle")
        .attr("cx", sevX)
        .attr("cy", sevY)
        .attr("r", sevR)
        .attr("fill", "none")
        .attr("opacity", 1)
        .attr("stroke", "#fff")

    var sevText = severityLegend.append("text")
        .attr("fill", "#fff")
        .attr("x", sevX)
        .attr("y", sevY)
        .attr("dominant-baseline", "middle")
        .attr("text-anchor", "middle")


    //Setup force simulation for bubbles
    var simulation = d3.forceSimulation()
        .force("forceX", d3.forceX().strength(function(d){ return (groupSelector == "region"  || groupSelector == "political_aff" ? 0.5 : 0.2)}).x((width/2)))
        .force("forceY", d3.forceY().strength(5).y(
            function(d, i){
                var w = (groupSelector == "region" || groupSelector == "political_aff" ? y.bandwidth()/2 : 0)
                return y(d[groupSelector]) + w;
            }))
        //.force("center", d3.forceCenter().x(width * .5).y(height * .5))
        .force("charge", d3.forceManyBody().strength(-50));


    //Initialize legend section
    colorLegend = legends.append("g")
        .attr("class", "time-legend")
        .attr("transform", "translate(" + width * 0.43 + "," + 45 + ")")

    var c = [];
    var color_text_labels = [],
        ticks = [];

    svg_init();
    initilize();

    function svg_init(){
        var legendW = width * 0.05
        for (var i=1; i<11; ++i){
            c.push({
                'val': 0.1 * i,
                'x': legendW * i
            })
            if (i == 1 || i == 6){
                color_text_labels.push({
                    'text': ((0.1 * i)* 20).toFixed(0),
                    'x': legendW * i
                })
                ticks.push({ 'x': legendW*i })
            } else if (i == 10){
                color_text_labels.push({
                    'text': ((0.1 * i) * 20).toFixed(0),
                    'x': legendW * (i+1)
                })
                ticks.push({ 'x': legendW*(i+1) })
            } 
        }
    
        colorLegend.selectAll("rect")
            .data(c)
            .enter()
            .append("rect")
            .attr('x', function(d){ return d.x; })
            .attr("y", 0)
            .attr("height", legendW)
            .attr("width", legendW)
            .attr("fill", function(d){
                return colorScale(d.val * colorScale.domain()[1]);
            })
        
        colorLegend.append("line")
            .attr("transform", "translate(" + legendW +"," + legendW + ")")
            .attr("x1", 0)
            .attr("x2", legendW * 10)
            .attr("y1", 0)
            .attr("y2", 0)
            .attr("stroke", "#fff")
    
        colorLegend.selectAll(".legend-ticks")
            .data(ticks)
            .enter()
            .append("line")
            .attr("class", "legend-ticks")
            .attr("x1", function(d){ return d.x; })
            .attr("x2", function(d){ return d.x; })
            .attr("y1", -5 + legendW)
            .attr("y2", 5 + legendW)
            .attr("stroke", "#fff")
    
    
        colorLegendText = colorLegend.append("text")
            .attr("x", 6* legendW)
            .attr("y", -18)
            .attr("fill", "#fff")
            .text("Days Since States 100th Case")
            .attr("text-anchor", "middle")
    }

    function bubblesChart(){
        draw_vis(chart_data);
    }

    function initilize(){
        //Setup data in aggregated format
        var data = d3.nest()
            .key(function(d){ return d.state; })
            .object(states_data)

        const entries = Object.entries(anno);
        for (const [key, vals] of entries){
            if (vals.date != undefined){
                var hundredCaseDate;
                var tmp = data[full2abbrev[key]]
                var arr = tmp.filter(function(d){
                    if (d.positive >=100){
                        hundredCaseDate = d.date;
                    }
                    return d.date.getTime() == vals.date.getTime()
                })

                var pop = populations.filter(function(d){
                    if (d.State == key) return d.Population
                })[0].Population

                var affiliation = political_aff[key].affiliation
                var stayAtHomeDate = arr[0].date
                var state_hundred = getTimeDiff(hundredCaseDate, stayAtHomeDate)
                var us_first = getTimeDiff(usFirstCase, stayAtHomeDate)
                var us_hundred = getTimeDiff(usHundredCase, stayAtHomeDate)
                var cases = arr[0].positive
                var death = arr[0].death

                chart_data.push({
                    'state': key,
                    'date': stayAtHomeDate,
                    'state_hundred': state_hundred,
                    'us_hundred_case': us_hundred,
                    'us_first_case': us_first,
                    'cases': cases,
                    'deaths': death,
                    'region': vals.region,
                    'population': pop,
                    'cases_per_capita': cases/pop,
                    'deaths_per_capita': death/pop,
                    'urban': urban_percent[key].urban,
                    'political_aff': affiliation
                })
            }
        }
        yLinearPop.domain([0, 40000000])
        yLinearUrban.domain([min_urban, max_urban])
        format_yAxis();
        format_area();
    }

    function sevTextFormat(t){
        //Format text for the severity legend
        t = t * 2 * 0.8
        if (severitySelector == "cases"){
            //return numberWithCommas(Math.round(t/1000) *1000)  + " Cases";
            return numberWithCommas(Math.round(t/1000) *1000)
        } else if (severitySelector == "cases_per_capita"){
            //return t.toExponential(0) + " Cases per Capita";
            return t.toExponential(0)
        } else if (severitySelector == "deaths"){
            // return numberWithCommas(Math.round(t/10) *10)  + " Deaths" ;
            return numberWithCommas(Math.round(t/10) *10)
        } else if (severitySelector == "deaths_per_capita"){
            // return t.toExponential(0) + " Deaths per Capita";
            return t.toExponential(0)
        }
    }

    function numberWithCommas(num) {
        //Retuns number seperated by commas
        if (typeof(num) == "string") return num
        if (num > 1) return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        else return num.toExponential(1)
    }

    function draw_vis(data){
        var a_max = d3.max(chart_data, function(d){
            return d[severitySelector]
        })

        a.domain([0,area2radius(a_max)])
        color_max = d3.max(chart_data, function(d){ return d[timeSelector]; })
        colorScale.domain([0, color_max])
        sevText.text(sevTextFormat(a_max))

        color_text_labels[0].text = 0
        color_text_labels[1].text = Math.round(colorScale.domain()[1]/2)
        color_text_labels[2].text = colorScale.domain()[1]


        vis_nodes.selectAll("circle").remove()
        vis_texts.selectAll("text").remove()
        //TODO FIX DIS JANK

        var node = vis_nodes.selectAll("circle")
            .data(data, function(d){ return d.state; })
            .enter()
            .append("circle")
            .attr("class", "node-circle")
            .attr("stroke-width", "0.5px")
            .attr("id", function(d){
                return "circle-"+ full2abbrev[d.state]})
            .attr("fill", function(d){ return colorScale(d[timeSelector]); })
            .attr("cx", function(d){ d.x; })
            .attr("cy", function(d){ d.y; })
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended)
            )
            .attr("r", function(d){ return a(area2radius(d[severitySelector])); });

        var texts = vis_texts.selectAll("text")
            .data(data)
            .enter()
                .append("text")
                .attr("class", "node-texts")
                .attr("x", function(d){ return d.x; })
                .attr("x", function(d){ return d.y; })
                .text(function(d){
                    if (a(area2radius(d[severitySelector])) >= 14) return full2abbrev[d.state]; })
                .attr("fill", (function(d){
                    return (d[timeSelector] >= 10 ? "#fff" : "#000"); 
                }))


        d3.selectAll(".node-circle")
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseout", mouseout)
            .on("click", clicked)

        d3.selectAll(".node-texts")
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseout", mouseout)
            .on("click", clicked)
    
        simulation
            .nodes(data)
            .force("collide", d3.forceCollide().strength(0.8).radius(function(d){ return a(area2radius(d[severitySelector])) + nodePadding; }).iterations(1))
            .on('tick', function(d){
                node
                    .attr("cx", function(d){
                        return d.x; })
                    .attr("cy", function(d){ return d.y; })

                texts
                    .attr("x", function(d){ return d.x; })
                    .attr("y", function(d){ return d.y; })
            })
        simulation.alphaTarget(.03).restart()

        var colorLegendTexts = colorLegend.selectAll(".legend-text-label")
            .data(color_text_labels, function(d){ return d.text})

        colorLegendTexts.text(function(d){ return d.text; })

        colorLegendTexts
            .enter()
            .append("text")
            .attr("class", "legend-text-label")
            .attr("transform", "translate(0,50)")
            .attr("x", function(d){ return d.x; })
            .attr("y", 0)
            .attr("fill", "#fff")
            .attr("text-anchor", "middle")
            .attr("font-size", "1.3rem")
            .text(function(d){ return d.text})


    }

    function format_yAxis(){
        //Update the Y axis scales based on input selection
        if (groupSelector == "population"){
            y = yLinearPop

            axisLabels.select("#grouping-label")
                .text("Population (Millions)")

            yAxis.scale(y)
            yAxis
                .ticks()
                .tickPadding(10)
                .tickFormat(d3.formatPrefix(".1", 1e6))

            axes.call(yAxis)
            gridlines.call(make_y_gridlines()
                .tickSize(-(width))
                .tickFormat("")
            )

            
        } else if (groupSelector == "region"){
            y = yOrdinalRegion;
            axisLabels.select("#grouping-label").text("Geographic Region of US")

            yAxis.scale(y)
                .ticks(5)
                .tickPadding(10)
                .tickFormat(null)

            axes.call(yAxis)
            gridlines.call(make_y_gridlines()
                .tickSize(-width)
                .tickFormat(""))

        } else if (groupSelector == "urban"){
            y = yLinearUrban
            
            axisLabels.select("#grouping-label").text("Percent Urbanization")

            yAxis.scale(y)
                .tickPadding(10)
                .tickFormat(null)

            axes.call(yAxis)
            gridlines.call(make_y_gridlines()
                .tickSize(-width)
                .tickFormat("")
            )
        } else if (groupSelector == "political_aff"){
            y = yOrdinalPol;
            axisLabels.select("#grouping-label").text("Political Affiliation")

            yAxis.scale(y)
                .ticks(3)
                .tickPadding(10)
                .tickFormat(null)

            axes.call(yAxis)
            gridlines.call(make_y_gridlines()
                .tickSize(-width)
                .tickFormat(""))
        }
        
    }

    function format_area(){
        var tmp;
        if (severitySelector == "cases")                    tmp = width*0.1;
        else if (severitySelector == "deaths")              tmp = width*0.1;
        else if (severitySelector == "cases_per_capita")    tmp = width*0.08;
        else if (severitySelector == "deaths_per_capita")   tmp = width*0.08;

        a.range([0,tmp])

    }

    function format_timeScale(){
    }

    function make_y_gridlines(){
        var tmp = yAxis.ticks()
        return tmp
    }

    function getTimeDiff(t1, t2=today) {
        return Math.round((t2-t1)/(1000*60*60*24));
    }

    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(.03).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
  
    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }
  
    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(.03);
        d.fx = null;
        d.fy = null;
    }

    function area2radius(area){
        return Math.sqrt(area)/Math.PI
    }

    function mouseover(d){
        tooltip
            .transition().duration(250)
            .style("opacity", 1)

        document.body.style.cursor = "pointer"
        update_highlight(full2abbrev[d.state], 'on')

    }

    function display_hover(d, action){
        if (!focus.includes(d)){
            d3.select("#circle-" + d)
                .attr("stroke", function(){ return (action == "on" ? "steelblue" : "#000"); })
                .attr("stroke-width", function(){ return (action == "on" ? "3px": "0.5px"); })
        }
    }

    function mousemove(d){
        tooltip
        .html("State: " + d.state + "<br>" + 
            severitySelector + ": " + numberWithCommas(d[severitySelector]) + "<br>" + 
            'Stay at home order: ' + formatTime(d.date) + "<br>" + 
            timeSelector + ": " + d[timeSelector] + "<br>" +
            groupSelector + ": " + numberWithCommas(d[groupSelector])
        )
        .style("left", (d3.mouse(this)[0]+ 175) + "px")
        .style("top", (d3.mouse(this)[1]+50) + "px")


    }

    function mouseout(d){
        tooltip
            .transition().duration(250)
            .style("opacity", 0)
        document.body.style.cursor = "default"
        update_highlight(full2abbrev[d.state], "off")
    }


    function add2Focus(d, i){
        if (!focus.includes(d)){
            focus.push(d)
            d3.select("#circle-" + d)
                .attr("stroke-width", 5)
                .attr("r", function(d){ return 1.2 * a.range()[1]; })
                .attr("stroke", function(d){ return "#fff"})
                .transition().duration(1000)
                .attr("r", function(d){ return a(area2radius(d[severitySelector])); })
                .attr("stroke", color(cur_color))
            cur_color += 1;
        } 
    }
    
    function clicked(d, i){
        if (focus.includes(full2abbrev[d.state])) update_focus(full2abbrev[d.state], "remove")
        else update_focus(full2abbrev[d.state], "add")
    }

    function removeFromFocus(d, i){
        if (focus.includes(d)){
            const index = focus.indexOf(d);
            focus.splice(index, 1);
        }

        d3.select("#circle-" + d)
            .attr("stroke", "#000")
            .attr("stroke-width", "0.5px")

        update_vis(focus);
    }


    //Getters & Setters for Vis
    bubblesChart.width = function(value){
        if (!arguments.length) return width;
        width = value;
        return bubblesChart;
    }

    bubblesChart.height = function(value){
        if (!arguments.length) return height;
        height = value;
        return bubblesChart;
    }

    bubblesChart.states = function(value){
        if (!arguments.length) return states;
        states = value;
        return bubblesChart;  
    }

    bubblesChart.colors = function(value){
        if (!arguments.length) return colors;
        colors = value;
        return bubblesChart;  
    }

    bubblesChart.anno = function(value){
        if (!arguments.length) return anno;
        anno = value;
        return bubblesChart;  
    }

    bubblesChart.groupSelector = function(value){
        if (!arguments.length) return groupSelector;
        groupSelector = value;
        format_yAxis();
        bubblesChart();
        return bubblesChart;  
    }
    
    bubblesChart.severitySelector = function(value){
        if (!arguments.length) return severitySelector;
        severitySelector = value;
        format_area();
        bubblesChart();
        return bubblesChart;  
    }   

    bubblesChart.timeSelector = function(value){
        if(!arguments.length) return timeSelector;
        timeSelector = value;
        format_timeScale();
        bubblesChart();
        return bubblesChart();
    }
    
    bubblesChart.focus = function(value){
        if(!arguments.length) return focus;
        focus = value;
        return bubblesChart;
    }

    bubblesChart.highlight = function(value, action){
        if(!arguments.length) return highlight;
        highlight = value;
        display_hover(value, action);
        return bubblesChart;
    }  

    bubblesChart.addFocus = function(value, action){
        if(!arguments.length) return addFocus;
        if (action == "add") add2Focus(value)
        else if (action == "remove") removeFromFocus(value)
        return bubblesChart;
    }


    return bubblesChart;
}


