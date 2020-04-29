function selector(config){
    var margin = { left:10, right:60, top:10, bottom:10 },
        states_list = config.states_list,
        full2abbrev = config.full2abbrev,
        defaultColor = config.defaultColor,
        defaultOpacity = config.defaultOpacity

    var focus = [];
    var height = config.height - margin.top - margin.bottom, 
        width = config.width - margin.left - margin.right;

    var color = d3.scaleOrdinal(config.scheme);
    var cur_color = 0;
      
    // append the svg object to the body of the page
    var svg = d3.select(config.selection)
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    var rect_svg = svg.append("g")
    var text_svg = svg.append("g")

    var icons_loc = svg.append("g")
        .attr("class", "states-icons")
        .attr("transform", "translate(" + (width + margin.right*0.4) + ",25)")
    
    icons_loc.append("text")
        .attr("font-family", "FontAwesome")
        .attr("font-size", "2rem")
        .attr("x", 0)
        .attr("y", 0)
        .attr("text-anchor", "middle")
        .attr("fill", "lightsteelblue")
        .attr("text-anchor", "middle")
        .attr("opacity", 0.5)
        .text("\uf059")
        .on("click", helpIconClick)
        .on("mouseover", helpIconHover)
        .on("mouseout", helpIconLeave)

    function helpIconClick(d){
        $("#selectionModal").modal();
    }

    function helpIconHover(d){
        document.body.style.cursor = "pointer"
        d3.select(this).attr("fill", "#d1d134")
            .attr("opacity", 1)
    }

    function helpIconLeave(d){
        d3.select(this).attr("fill", "lightsteelblue")
            .attr("opacity", 0.5)
            document.body.style.cursor = "default"
    }

    
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
            .attr("fill", defaultColor)
            .attr('opacity', defaultOpacity)
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
        update_highlight(d.state, "on")
    }

    function mousemove(d){

    }

    function display_hover(d, action){
        if (!focus.includes(d)){
            d3.select("#sel-rect-" + d)
                .attr("stroke", function(){ return (action == "on" ? "steelblue": "#000"); })
                .attr("stroke-width", function(){ return (action == "on" ? "3px": "0"); })
                .attr("opacity", function(){ return (action == "on" ? 1 : defaultOpacity ); } )
        }
    }

    function mouseout(d){
        document.body.style.cursor = "default"
        update_highlight(d.state, "off");
    }

    function clicked(d){
        if (focus.includes(d.state)) update_focus(d.state, "remove")
        else update_focus(d.state, "add")
    }
  
    function add2Focus(d, i){
        if (!focus.includes(d)){
            focus.push(d)
            d3.select("#sel-rect-" + d)
                .raise()
                .attr("fill", "#fff")
                .attr("x", function(d){ return x(d.x) - x.bandwidth()/4; })
                .attr("width", function(d){ return x.bandwidth()*1.5; })
                .attr("stroke-width", 0)
                .attr("opacity", 1)
                .transition().duration(750)
                .attr("fill", color(cur_color))
                .attr("x", function(d){ return x(d.x); })
                .attr("width", x.bandwidth())
            cur_color += 1;
            
        } 
    }

    function removeFromFocus(d, i){
        if (focus.includes(d)){
            const index = focus.indexOf(d);
            focus.splice(index, 1);
        }

        d3.select("#sel-rect-" + d)
            .attr("opacity", defaultOpacity)
            .attr("fill", defaultColor)

        //update_vis(focus);
    }

    function highlight_focus(){

        focus.forEach(function(d, i){
            d3.select("#sel-rect-" + d)
                .transition().duration(1000)
                .attr("fill", function(d){
                    return color(i)
                })
                .attr("x", function(d){ return x(d.x); })
                .attr("width", x.bandwidth())
                
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

    
    stateSelection.highlight = function(value, action){
        if(!arguments.length) return highlight;
        highlight = value;
        display_hover(value, action);
        return stateSelection;
    }
    
    stateSelection.addFocus = function(value, action){
        if(!arguments.length) return addFocus;
        if (action == "add") add2Focus(value)
        else if (action == "remove") removeFromFocus(value)
        return stateSelection;
    }

    return stateSelection;
}


