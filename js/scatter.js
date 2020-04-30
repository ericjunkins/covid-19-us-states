function scatter_chart(config){
    var margin = { left:120, right:40, top:20, bottom:80 }
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
        defaultColor = config.defaultColor,
        scatterDefaultOpacity = config.defaultOpacity * 1.5,
        dur = config.duration,
        scatterFocus = [];

        var color = d3.scaleOrdinal(config.scheme);
        var cur_color = 0; 

    var max_pop = 40000000,
        min_pop = 0,
        max_urban = 100,
        min_urban = 0

    var usFirstCase = new Date(2020, 0, 21),
        usHundredCase = new Date(2020, 2, 5);

    var today = new Date();
    var radius_max = 20        
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

    var gridlines = grid.append("g")
        .attr("class", "grid")

    //Set Scales
    var a = d3.scaleLinear()
        .range([0, radius_max])

    var yOrdinalRegion = d3.scaleBand()
        .domain(['Northeast', 'West', 'South', 'Midwest', 'Other'])
        //.range([radius_max, height - radius_max])
        .range([0, height])

    var yOrdinalPol = d3.scaleBand()
        .domain(["Republican", "Democratic", "Other"])
        .range(yOrdinalRegion.range())

    var yLinearPop = d3.scaleLinear()
        //.range([height - radius_max, radius_max])
        .range([height, 0])
        

    var yLinearUrban = d3.scaleLinear()
        //.range([height - radius_max, radius_max])
        .range([height, 0])

    var xLinear = d3.scaleLinear()
        .range([0,width])

    var colorScale = d3.scaleSequential(d3.interpolateReds)
        .domain([-3,20])

    var scatterTooltip =  d3.select("#scatterTooltip")
        .append("div")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("font-size", "1.5rem")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "3px")
        .style("border-radius", "5px")
        .style("padding", "5px")

    //Default to Population Sorted
    var y = yLinearPop;
    var yAxis = d3.axisLeft();
    var gridAxis = d3.axisLeft().ticks(null);
    var xAxis = d3.axisBottom()

    var labels = svg.append('g')
        .attr("class", "labels")

    xAxisCall = labels.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("class", "axis axis--x axisWhite")

    yAxisCall = labels.append("g")
        .attr("class", "axis axis--y axisWhite")
   
    gridLinesCall = axes.append('g')
        .attr("class", "axis axis--y gridlines")


    var scatter = svg.append('g')
        .attr("class", "scatter")

    var yAxisText = axisLabels.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height/2)
        .attr("y", -margin.left*0.7)
        .attr("class", "axis-label")
        .attr("id", "#grouping-label")

    var xAxisText = axisLabels.append("text")
        .attr("transform", "translate(" + width/2 + "," + height + ")")
        .attr("x", 0)
        .attr("y", margin.bottom*0.7)
        .attr("class", "axis-label")
        .attr("id", "#time-label")

    initilize();

    function scatterChart(){
        draw_vis();
    }

    function initilize(){
        //Setup data in aggregated format
        var data = d3.nest()
            .key(function(d){ return d.state; })
            .object(states_data)

        const entries = Object.entries(anno);
        var id=0;
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
                    'id': id,
                    'state': full2abbrev[key],
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
            id +=1
        }
        yLinearPop.domain([0, 40000000])
        yLinearUrban.domain([min_urban, max_urban])
        format_yAxis();
        format_area();
        format_xAxis();
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

    function draw_vis(){


        xAxisCall.call(xAxis)
        yAxisCall.call(yAxis)
        //gridLinesCall.call(gridAxis)
        //sevText.text(sevTextFormat(a_max))

        // color_text_labels[0].text = 0
        // color_text_labels[1].text = Math.round(colorScale.domain()[1]/2)
        // color_text_labels[2].text = colorScale.domain()[1]

        var circles = scatter.selectAll(".severity-circle")
            .data(chart_data, function(d){ return d.id; })

        circles.exit().remove()

        circles
            .transition().duration(dur)
            .attr("cx", function(d){ return xLinear(d[timeSelector]); })
            .attr("cy", function(d){ 
                if (groupSelector == "political_aff" || groupSelector == "region"){
                    return y(d[groupSelector]) + y.bandwidth()/2
                } else return y(d[groupSelector]); })
            .attr("r", function(d){ return a(area2radius(d[severitySelector])); })

        circles.enter()
            .append("circle")
                .on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseout", mouseout)
                .on("click", clicked)
            .raise()
            .attr("class", "severity-circle")
            .attr("id", function(d){ return "sev-circ-" + d.state; })
            .attr("cx", function(d){ return xLinear(d[timeSelector]); })
            .attr("cy", function(d){ 
                if (groupSelector == "political_aff" || groupSelector == "region"){
                    return y(d[groupSelector]) + y.bandwidth()/2
                } else return y(d[groupSelector]); })
            .attr("opacity", scatterDefaultOpacity)
            .attr("r", 0)
            .transition().duration(dur)
            .attr("r", function(d){ return a(area2radius(d[severitySelector])); })
            .attr("fill", defaultColor)

    }

    function format_yAxis(){
        //Update the Y axis scales based on input selection
        if (groupSelector == "population"){
            y = yLinearPop
            yAxisText.text("Population (Millions)")

            yAxis.scale(y)
            gridAxis.scale(y)
            yAxis
                .ticks()
                .tickPadding(10)
                .tickFormat(d3.formatPrefix(".1", 1e6))

            gridlines.call(make_y_gridlines()
                .tickSize(-(width))
                .tickFormat("")
            )

        } else if (groupSelector == "region"){
            y = yOrdinalRegion;
            yAxisText.text("Geographic Region of US")

            yAxis.scale(y)
                .ticks(5)
                .tickPadding(10)
                .tickFormat(null)

            // axes.call(yAxis)
            
            gridAxis.scale(y)
            gridlines.call(make_y_gridlines()
                .tickSize(-width)
                .tickFormat(""))

        } else if (groupSelector == "urban"){
            y = yLinearUrban
            
            yAxisText.text("Percent Urbanization")

            yAxis.scale(y)
                .tickPadding(10)
                .tickFormat(null)

            // axes.call(yAxis)
            
            gridAxis.scale(y)
            gridlines.call(make_y_gridlines()
                .tickSize(-width)
                .tickFormat("")
            )
        } else if (groupSelector == "political_aff"){
            y = yOrdinalPol;
            yAxisText.text("Political Affiliation")

            yAxis.scale(y)
                .ticks(3)
                .tickPadding(10)
                .tickFormat(null)

            // axes.call(yAxis)
            
            gridAxis.scale(y)
            gridlines.call(make_y_gridlines()
                .tickSize(-width)
                .tickFormat(""))
        }
    }

    function format_area(){
        var a_max = d3.max(chart_data, function(d){
            return d[severitySelector]
        })

        a.domain([0,area2radius(a_max)])
        var tmp;
        // if (severitySelector == "cases")                    tmp = width*0.1;
        // else if (severitySelector == "deaths")              tmp = width*0.1;
        // else if (severitySelector == "cases_per_capita")    tmp = width*0.08;
        // else if (severitySelector == "deaths_per_capita")   tmp = width*0.08;

        if (severitySelector == "cases")                    tmp = 60;
        else if (severitySelector == "deaths")              tmp = 60;
        else if (severitySelector == "cases_per_capita")    tmp = 60;
        else if (severitySelector == "deaths_per_capita")   tmp = 60;

        a.range([0,tmp])

    }

    function format_xAxis(){
        xMax = d3.max(chart_data, function(d){ return d[timeSelector]; })
        xMin = d3.min(chart_data, function(d){ return d[timeSelector]; })
        xLinear.domain([xMin, xMax + 2])
        xAxis.scale(xLinear)
        


        if (timeSelector == "state_hundred"){
            var t = "Days between state's 100th Case and lockdown order"
            // svg.append("line")
            //     .attr("id", "zero-day-line")
            //     .attr("x1", xLinear(0))
            //     .attr("x2", xLinear(0))
            //     .attr("y1", 0)
            //     .attr("y2", height)
        } else if (timeSelector =="us_hundred_case") t = "Days since US's 100th Case"
        else if (timeSelector == "us_first_case") t = "Days since US's 1st Case"
        xAxisText.text(t)
    }

    function make_y_gridlines(){
        var tmp = gridAxis.ticks()
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
        scatterTooltip
            .transition().duration(250)
            .style("opacity", 1)

        document.body.style.cursor = "pointer"
        update_highlight(d.state, 'on')

    }

    function display_hover(d, action){
        if (!scatterFocus.includes(d)){
            d3.select("#sev-circ-" + d)
                .attr("opacity", function(){ return (action == "on" ? 1 : scatterDefaultOpacity); })
        }
    }

    function mousemove(d){
        if (groupSelector == "region") groupText = "Region: "
        else if (groupSelector == "population") groupText = "Population: "
        else if (groupSelector == "urban") groupText = "Percent Urban: "
        else if (groupSelector == "political_aff") groupText = "Political Affiliation: "

        if (timeSelector == "state_hundred") timeText = "Days between State's 100th case and Lockdown: "
        else if (timeSelector == "us_hundred_case") timeText = "Days between US's 1st case and Lockdown: "
        else if (timeSelector == "us_first_case") timeText = "Days between US's 100th case and Lockdown: "

        if (severitySelector == "cases") sevText = "Number of Cases at lockdown: "
        else if (severitySelector == "cases_per_capita") sevText = "Number of Deaths per Capita at lockdown: "
        else if (severitySelector == "deaths") sevText = "Number of Deaths at lockdown: "
        else if (severitySelector == "deaths_per_capita") sevText = "Number of Deaths per Capita at lockdown: "

        scatterTooltip
            .html(
                "State: " + d.state + "<br>" + 
                groupText +  d[groupSelector] + "<br>" + 
                timeText  +  d[timeSelector] + "<br>" + 
                sevText   +  d[severitySelector] + "<br>"
                
        )
        .style("left", (d3.mouse(this)[0]+ 175) + "px")
        .style("top", (d3.mouse(this)[1]+50) + "px")


    }

    function mouseout(d){
        scatterTooltip
            .transition().duration(250)
            .style("opacity", 0)
        document.body.style.cursor = "default"
        update_highlight(d.state, "off")
    }


    function add2Focus(d, i){
        if (!scatterFocus.includes(d)){
            scatterFocus.push(d)
            d3.select("#sev-circ-" + d)
                .raise()
                .attr("r", function(d){ return 1.2 * a.range()[1]; })
                .attr("fill", "#fff")
                .transition().duration(dur)
                .attr("r", function(d){ return a(area2radius(d[severitySelector])); })
                .attr("fill", color(cur_color))
            cur_color += 1;
        }
    }
    
    function clicked(d, i){
        if (scatterFocus.includes(d.state)) update_focus(d.state, "remove")
        else update_focus(d.state, "add")
    }

    function removeFromFocus(d, i){
        if (scatterFocus.includes(d)){
            const index = scatterFocus.indexOf(d);
            scatterFocus.splice(index, 1);
        }

        d3.select("#sev-circ-" + d)
            .attr("fill", defaultColor)
            .attr("opacity", scatterDefaultOpacity)

    }


    //Getters & Setters for Vis
    scatterChart.width = function(value){
        if (!arguments.length) return width;
        width = value;
        return scatterChart;
    }

    scatterChart.height = function(value){
        if (!arguments.length) return height;
        height = value;
        return scatterChart;
    }

    scatterChart.states = function(value){
        if (!arguments.length) return states;
        states = value;
        return scatterChart;  
    }

    scatterChart.colors = function(value){
        if (!arguments.length) return colors;
        colors = value;
        return scatterChart;  
    }

    scatterChart.anno = function(value){
        if (!arguments.length) return anno;
        anno = value;
        return scatterChart;  
    }

    scatterChart.groupSelector = function(value){
        if (!arguments.length) return groupSelector;
        groupSelector = value;
        format_yAxis();
        scatterChart();
        return scatterChart;  
    }
    
    scatterChart.severitySelector = function(value){
        if (!arguments.length) return severitySelector;
        severitySelector = value;
        format_area();
        scatterChart();
        return scatterChart;  
    }   

    scatterChart.timeSelector = function(value){
        if(!arguments.length) return timeSelector;
        timeSelector = value;
        format_xAxis();
        scatterChart();
        return scatterChart();
    }
    
    // scatterChart.focus = function(value){
    //     if(!arguments.length) return focus;
    //     focus = value;
    //     return scatterChart;
    // }

    scatterChart.highlight = function(value, action){
        if(!arguments.length) return highlight;
        highlight = value;
        display_hover(value, action);
        return scatterChart;
    }  

    scatterChart.addFocus = function(value, action){
        if(!arguments.length) return addFocus;
        if (action == "add") add2Focus(value)
        else if (action == "remove") removeFromFocus(value)
        return scatterChart;
    }


    return scatterChart;
}


