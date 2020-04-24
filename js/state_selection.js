function selector(config){
    var margin = { left:20, right:20, top:10, bottom:20 },
        states_list = config.states_list,
        full2abbrev = config.full2abbrev

    var focus = [];

    var height = config.height - margin.top - margin.bottom, 
        width = config.width - margin.left - margin.right;
    
    // append the svg object to the body of the page
    var svg = d3.select(config.selection)
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    var rect_svg = svg.append("g")
    var text_svg = svg.append("g")

    console.log(width)
    console.log(height)
    var num_rows = config.rows;
    var items_per_row = Math.ceil((states_list.length)/num_rows)

    var xBand = [];
    for (var i=0; i<items_per_row; ++i){
        xBand.push(String(i));
    }


    var yBand = [];
    for (var i=0; i< num_rows; ++i){
        yBand.push(String(i));
    }
    var y = d3.scaleBand()
        .domain(yBand)
        .range([0, height])
        .padding(0.06)

    var x = d3.scaleBand()
        .domain(xBand)
        .range([0, width])
        .padding(0.03)

    var color = d3.scaleOrdinal(d3.schemeDark2);
    
    function stateSelection(){
        draw_chart();
    }

    function draw_chart(){
        data = [];
        var counter = 0;
        var row = 0;
        states_list.forEach(function(d, i){
            if (counter >= items_per_row){
                counter = 0;
                row += 1;
            }
            data.push({'id': i, 'fullname': d, 'state': full2abbrev[d], 'x': counter, 'y': row })
            counter += 1
        })
    

        data.push({'id': states_list.length, 'fullname': '', 'state': '', 'x': items_per_row-1, 'y': num_rows-1 })


        rects = rect_svg.selectAll("rect")
            .data(data)

        rects.enter()
            .append("rect")
            .attr("class", "selection-rect")
            .attr("id", function(d){ return "sel-rect-"+ d.state; })
            .attr("y", function(d, i){ return y(d.y); })
            .attr("x", function(d, i){  return x(d.x); })
            .attr("height", y.bandwidth())
            .attr("width", x.bandwidth())
            .attr("fill", "grey")
            .attr('opacity', 0.2)
            .attr("rx", 3)


        texts = text_svg.selectAll("text")
            .data(data)

        texts.enter()
            .append("text")
            .attr("class", "selection-text")
            .attr("id", function(d){ return "sel-text-"+ d.state; })
            .attr("y", function(d, i){ return y(d.y) + y.bandwidth()/2; })
            .attr("x", function(d, i){  return x(d.x) + x.bandwidth()/2; })
            .attr("fill", "#fff")
            .text(function(d){ return d.state})
            .attr("font-size", "1.5rem")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")

        d3.selectAll(".selection-rect")
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseout", mouseout)
            .on("click", clicked)

        d3.selectAll(".selection-text")
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseout", mouseout)
            .on("click", clicked)
    }
    function mouseover(d){
        document.body.style.cursor = "pointer"
    }

    function mousemove(d){
        if (!focus.includes(d.state)){
            d3.select("#sel-rect-" + d.state)
                .attr("stroke", "steelblue")
                .attr("stroke-width", "4px")
                .attr("opacity", 1)
        }
    }

    function mouseout(d){
        if (!focus.includes(d.state)){
            d3.select("#sel-rect-" + d.state)
                .attr("stroke-width", "0px")
                .attr("opacity", 0.20)
                
        }
        document.body.style.cursor = "default"
    }

    function clicked(d){
        if (focus.includes(d.state)) removeFromFocus(d.state, i)
        else add2Focus(d.state,i)
    }
  
    function add2Focus(d, i){
        if (!focus.includes(d)) focus.push(d)
        update_vis(focus);
    }

    function removeFromFocus(d, i){
        if (focus.includes(d)){
            const index = focus.indexOf(d);
            focus.splice(index, 1);
        }
        update_vis(focus);
    }

    function highlight_focus(){
        d3.selectAll(".selection-rect")
            .attr('stroke-width', "0")
            .attr("fill", "grey")
            .attr("opacity", 0.20)

        focus.forEach(function(d, i){
            d3.select("#sel-rect-" + d)
                .attr("fill", function(d){
                    return color(i)
                })
                .attr("opacity", "1")
        })
    }

    stateSelection.width = function(value){
        if (!arguments.length) return width;
        width = value;
        return stateSelection;
    }

    stateSelection.height = function(value){
        if (!arguments.length) return height;
        height = value;
        return stateSelection;
    }

    stateSelection.x = function(value){
        if(!arguments.length) return x;
        x = value;
        return stateSelection;
    }

    stateSelection.y = function(value){
        if(!arguments.length) return y;
        y = value;
        return stateSelection;
    }

    stateSelection.display_states = function(value){
        if(!arguments.length) return display_states;
        display_states = value;
        update_display_data();
        return stateSelection;
    }

    stateSelection.focus = function(value){
        if(!arguments.length) return focus;
        focus = value;
        highlight_focus();
        return stateSelection;
    }
    return stateSelection;
}


