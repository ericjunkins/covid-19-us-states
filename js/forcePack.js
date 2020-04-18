function forcePack(config){
    var margin = { left:50, right:20, top:20, bottom:20 }
    var height = config.height - margin.top - margin.bottom, 
        width = config.width - margin.left - margin.right,
        selection = config.selection,
        states_data = config.states_data,
        full2abbrev = config.full2abbrev,
        anno = config.anno,
        chart_data = [],
        nodePadding = 2.5,
        populations = config.census,
        severitySelector = config.severity;
        groupSelector = config.group;


    // append the svg object to the body of the page
    var svg = d3.select(selection)
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")


    var labels = svg.append("g")
        .attr("class", "labels")

    var vis_nodes = svg.append('g').attr("class", "nodes")
    var vis_texts = svg.append("g").attr("class", "nodes-text")

    labels.append("text")
        .attr('x', -height/2)
        .attr("y", 0)
        .text(config.regionFilter)
        .attr("fill", "#fff")
        .attr("font-size", "2rem")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        
    svg.append("line")
        .attr('x1', -margin.left/2)
        .attr("x2", width)
        .attr("y1", height + margin.bottom)
        .attr("y2", height + margin.bottom)
        .attr("stroke", "#fff")
    var today = new Date();

    var radius_max = 45

    var a = d3.scaleLinear()
        .range([0, radius_max])

    var yOrdinal = d3.scaleBand()
        .domain(['Northeast', 'West', 'South', 'Midwest', 'Other'])
        .range([0, height])

    var yLinear = d3.scaleLinear()
        .range([height - radius_max, radius_max])


    var y = yLinear;

    var simulation = d3.forceSimulation()
        .force("forceX", d3.forceX().strength(.20).x(width * .5))
        .force("forceY", d3.forceY().strength(5).y(
            function(d, i){
                var w = (groupSelector == "region" ? y.bandwidth()/2 : 0)
                return y(d[groupSelector]) + w;
            }))
        //.force("center", d3.forceCenter().x(width * .5).y(height * .5))
        .force("charge", d3.forceManyBody().strength(-50));

    var colorScale = d3.scaleSequential(d3.interpolateReds)
        .domain([0,20])

    initilize();

    function forcePack(){
        //var filtered = chart_data.filter(d => d.region == config.regionFilter)
        draw_vis(chart_data);
    }

    function initilize(){
        var data = d3.nest()
            .key(function(d){ return d.state; })
            .object(states_data)

        const entries = Object.entries(anno);
        for (const [key, vals] of entries){
            //console.log(key)
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

                var diff = getTimeDiff(hundredCaseDate, arr[0].date)
                var cases = arr[0].positive
                chart_data.push({
                    'state': key,
                    'date': arr[0].date,
                    'hundred': hundredCaseDate,
                    'time_diff': diff,
                    'cases': cases,
                    'region': vals.region,
                    'population': pop,
                    'cases_per_capita': cases/pop
                })
            }
        }
        var max_pop = d3.max(chart_data, function(d){
            return d.population;
        })
        var min_pop = d3.min(chart_data, function(d){
            return d.population;
        })
        
        yLinear.domain([min_pop ,max_pop])

    }

    function draw_vis(data){

        var a_max = d3.max(chart_data, function(d){
            return d[severitySelector]
        })

        console.log(a_max)
        a.domain([0,area2radius(a_max)])

        vis_nodes.selectAll("circle").remove()
        vis_texts.selectAll("text").remove()
        var node = vis_nodes.selectAll("circle")
            .data(data, function(d){ return d.state; })
            .enter()
            .append("circle")
            .attr("id", function(d){
                return "circle-"+ d.state})
            .attr("r", function(d){ return a(area2radius(d[severitySelector])); })
            .attr("fill", function(d){ return colorScale(d.time_diff); })
            // .attr("cx", function(d){ d.x; })
            // .attr("cy", function(d){ d.y; })
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended)
            );

        
        var texts = vis_texts.selectAll("text")
            .data(data)
            .enter()
                .append("text")
                .attr("class", "node-texts")
                .attr("x", function(d){ return d.x; })
                .attr("x", function(d){ return d.y; })
                .text(function(d){
                    if (a(area2radius(d[severitySelector])) >= 10) return full2abbrev[d.state]; })

        simulation
            .nodes(data)
            .force("collide", d3.forceCollide().strength(0.3).radius(function(d){ return a(area2radius(d[severitySelector])) + nodePadding; }).iterations(1))
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

    function draw_circles(){
    
    }

    function mouseover(d){
    }

    function mousemove(d){
    }

    function mouseout(d){
    }

    function clicked(d){
    }

    forcePack.width = function(value){
        if (!arguments.length) return width;
        width = value;
        return forcePack;
    }

    forcePack.height = function(value){
        if (!arguments.length) return height;
        height = value;
        return forcePack;
    }

    forcePack.states = function(value){
        if (!arguments.length) return states;
        states = value;
        return forcePack;  
    }

    forcePack.colors = function(value){
        if (!arguments.length) return colors;
        colors = value;
        return forcePack;  
    }

    forcePack.anno = function(value){
        if (!arguments.length) return anno;
        anno = value;
        return forcePack;  
    }

    forcePack.groupSelector = function(value){
        if (!arguments.length) return groupSelector;
        groupSelector = value;
        if (groupSelector == "region") y = yOrdinal;
        else if (groupSelector == "population") y = yLinear
        forcePack();
        return forcePack;  
    }
    
    forcePack.severitySelector = function(value){
        if (!arguments.length) return severitySelector;
        severitySelector = value;
        forcePack();
        return forcePack;  
    }   
    
    return forcePack;
}


