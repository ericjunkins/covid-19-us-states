function stateSelector(config){
    var margin = { left:20, right:20, top:20, bottom:20 }
    var height = config.height - margin.top - margin.bottom, 
        width = config.width - margin.left - margin.right,
        selection = config.selection,
        rect_height = 15,
        rect_width = 150

    var state_rects = [];

    // append the svg object to the body of the page
    var container = d3.select(selection)
        .append("div")
            .attr("id", "container")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .attr("overflow", "scroll")

    var view = container.append('svg')
        .attr("viewBox", "0,0,150,420")

    var y = d3.scaleBand()
    var x = d3.scaleBand()
        .domain(['0', '1'])
        .range([0,rect_width])
        .padding(0.02)


    function selectionChart(){
        var s = []
        for(var i =0; i< states.length/2; ++i){
            s.push(String(i))
        }
        y.domain(s)
            .range([0, states.length/2 * rect_height])
            .padding(0.05)
        
        draw_rects();
    }

    function draw_rects(){
        var rects = view.selectAll('rect')
            .data(states)

        rects.enter()
            .append("rect")
            .attr("x", function(d, i){
                return x(i % 2)
            })
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .attr("y", function(d, i){
                return y(Math.floor(i/2)); })
            .attr("fill", "#fff")

        var texts = view.selectAll('text')
            .data(states)

        texts.enter()
            .append("text")
            .attr("x", function(d, i){
                return x(i % 2) + x.bandwidth()/2
            })
            .attr("text-anchor", "middle")
            .attr("y", function(d, i){
                return y(Math.floor(i/2)) + y.bandwidth()/2; })
            .attr("stroke", "#000")
            .attr("font-size", "1rem")
            .attr("alignment-baseline", "middle")
            .text(function(d){ return d; })

    }

    selectionChart.width = function(value){
        if (!arguments.length) return width;
        width = value;
        return selectionChart;
    }

    selectionChart.height = function(value){
        if (!arguments.length) return height;
        height = value;
        return selectionChart;
    }

    selectionChart.states = function(value){
        if (!arguments.length) return states;
        states = value;
        return selectionChart;  
    }

    selectionChart.colors = function(value){
        if (!arguments.length) return colors;
        colors = value;
        return selectionChart;  
    }
    
    return selectionChart;
}


