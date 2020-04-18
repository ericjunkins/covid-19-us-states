function stateSelector(config){
    var margin = { left:20, right:20, top:20, bottom:20 }
    var height = config.height - margin.top - margin.bottom, 
        width = config.width - margin.left - margin.right,
        selection = config.selection,
        rect_height = 15,
        rect_width = 150

    var state_rects = []
    var colors = {}
    var display_states = ['NY', 'CA', 'CO', 'AK', 'MT']

    var color = d3.scaleOrdinal(d3.schemeTableau10);
    display_states.forEach(function(d, i){
        colors[d] = color(i)
    })

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
            .attr('id', function(d){ return 'rect-' + d})
            .attr("x", function(d, i){
                return x(i % 2)
            })
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .attr("y", function(d, i){
                return y(Math.floor(i/2)); })
            .attr("fill", function(d){
                if (display_states.includes(d)) return colors[d]; 
                return '#fff';
            })
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseout", mouseout)
            .on("click", clicked)

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
            .attr("fill", "#000")
            .attr("font-size", "0.8rem")
            .attr("alignment-baseline", "middle")
            .text(function(d){ return d; })
            .on("click", clicked)

    }

    function mouseover(d){
    }

    function mousemove(d){
    }

    function mouseout(d){
    }

    function clicked(d){
        update_display_states(d)
    }

    function update_display_states(state){
        colors = {}
        if (!display_states.includes(state)){
            display_states.push(state)
            d3.select('#rect-' + state).attr("fill", color(display_states.length-1))
        } else {
            const index = display_states.indexOf(state)
            display_states.splice(index, 1)
            d3.select('#rect-' + state).attr("fill", '#fff')
        }
        display_states.forEach(function(d, i){
            colors[d] = color(i)
        })
        update_vis();
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
    
    selectionChart.display_states = function(value){
        if (!arguments.length) return display_states;
        display_states = value;
        return selectionChart;  
    }
    return selectionChart;
}


