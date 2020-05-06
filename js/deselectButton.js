function deselector(config){
    var margin = { left:10, right:10, top:10, bottom:10 },

        defaultColor = config.defaultColor,
        defaultOpacity = config.defaultOpacity *0.5,
        dur = config.duration

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
    

 

    function stateSelection(){
        draw_chart();
    }

    function draw_chart(){
        svg.append('rect')
            .attr("id", "deselect-rect")
                .on("mouseover", mouseover)
                .on("mouseout", mouseout)
                .on("click", clicked)
            .attr("opacity", defaultOpacity)
            .attr("fill", defaultColor)
            .attr("x", width/2)
            .attr("y", height/2)
            .attr("rx", 3)
            .attr("width", 0 )
            .attr("height", 0)
            .transition().duration(dur)
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width )
            .attr("height", height)
            

        svg.append('text')
            .attr("id", "deselect-text")
                .on("mouseover", mouseover)
                .on("mouseout", mouseout)
                .on("click", clicked)
            .attr("x", width/2)
            .attr("y", height/2)
            .attr("fill", "#fff")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .text("Unselect All")
            .attr("font-size", "0.1rem")
            .transition().duration(dur)
            .attr("font-size", "1.2rem")
    }

    function mouseover(d){
        document.body.style.cursor = "pointer"

        d3.select("#deselect-rect")
            .attr("opacity", 1)
            .attr("stroke", "steelblue")
            .attr("stroke-width", "2px")
    }

    function mouseout(d){
        d3.select("#deselect-rect")
            .attr("opacity", defaultOpacity)
            .attr("stroke", "steelblue")
            .attr("stroke-width", "0")

        document.body.style.cursor = "default"
    }

    function clicked(){
        d3.select("#deselect-rect")
            .attr("width", 1.5 * width)
            .attr("x", -width/4)
            .attr("fill", "#fff")
            .transition().duration(dur)
            .attr("fill", defaultColor)
            .attr("width", width)
            .attr("x", 0)
        update_focus("", "removeAll")
    }
  
    function add2Focus(d, i){
        if (!focus.includes(d)) focus.push(d)
    }

    function removeFromFocus(d, i){
        if (focus.includes(d)){
            const index = focus.indexOf(d);
            focus.splice(index, 1);
        }
    }
    
    function removeAll(d, i){
        focus = [];
    }

    stateSelection.addFocus = function(value, action){
        if(!arguments.length) return addFocus;
        if (action == "add") add2Focus(value)
        else if (action == "remove") removeFromFocus(value)
        else if (action == "removeAll") removeAll()
        return stateSelection;
    }

    return stateSelection;
}


