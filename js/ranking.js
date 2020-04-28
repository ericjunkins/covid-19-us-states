function ranking_chart(config){
    var margin = { left:50, right:10, top:30, bottom:80 }
    var focus = [];
    var currentData = config.currentData
        dur = config.duration;

    var height = config.height - margin.top - margin.bottom, 
        width = config.width - margin.left - margin.right;

    var color = d3.scaleOrdinal(d3.schemeDark2);
    var cur_color = 0;

    // append the svg object to the body of the page

    document.getElementById("outter1").setAttribute("style", "width:" + (width +margin.left + margin.right) + "px");
    document.getElementById("outter1").setAttribute("style", "height:" + (height + margin.top + margin.bottom) + "px");

    document.getElementById("placeholder1").setAttribute("style", "width:" + (width +margin.left + margin.right) + "px");
    document.getElementById("placeholder1").setAttribute("style", "height:" + (height + margin.top) + "px");
    
    const outerSvg = d3.select("#outter1").append('svg')
        .attr("width", width + margin.left + margin.right)

    var barHeight = height/18
    

    currentData.forEach(function(d){
        var total = 0,
            increases = 0
        d.values.forEach(function(v, i){
            increases += v.positiveIncrease
            total += v.positive
            if (i == 0) d.currentPercent = +(increases/total *100).toFixed(2);
            else if (i==2) d.threeDayPercent = +(increases/total *100).toFixed(2);
            else if (i==4) d.fiveDayPercent = +(increases/total *100).toFixed(2);
            else if (i==6) d.sevenDayPercent = +(increases/total *100).toFixed(2);
        })
    })

    currentData = currentData.filter(function(d){
        return (d.state != "MP" && d.state != "AS" && d.state != "GU")
    })

    var maxX = d3.max(currentData, function(d){ return d.threeDayPercent; })
    var minX = d3.min(currentData, function(d){ return d.threeDayPercent; })



    currentData.sort(function(a, b){
        return d3.ascending( a.threeDayPercent, b.threeDayPercent); 
    })


    const svg = d3.select(config.selection).append('svg')
        .attr("width", width)
        .attr("height", barHeight * currentData.length + barHeight*0.5)
        
    var chart = svg.append("g")
        .attr("transform", "translate(" + margin.left + ",10)")


    var axes = chart.append("g")

    var x = d3.scaleLinear()
        .domain([0, maxX])
        .range([0, width])
    
    range = d3.range(28, (currentData.length + 1) * 28, 28)

    var y = d3.scaleBand()
        .domain(currentData.map(function(d){ return d.state; }))
        .range([barHeight*currentData.length, 0])
        .padding(0.05)

    var x_axis = d3.axisBottom(x).ticks(4)
    var y_axis = d3.axisLeft(y)

    function rankChart(){
        outerSvg.append("g")
            .attr("class", "axis axis--y axisWhite")
            .attr("transform", "translate(" + margin.left + ",0)")
            .call(x_axis)
        
        outerSvg.append("text")
            .attr("class", "axis-label")
            .attr("transform", "translate(" + margin.left + ",0)")
            .attr("y", 40)
            .attr("x",(width/2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .attr("font-size", "2rem")
            .text("Average % Increase (Cases)")

        axes.append("g")
            .attr("class", "axis axis--y axisWhite")
            .call(y_axis)

        draw_chart();
    }

    function draw_chart(data){
        
        var rects = chart.selectAll("rect")
            .data(currentData)

        rects.enter()
            .append("rect")
            .attr("class", "ranking-rect")
            .attr("id", function(d){ return "rank-rect-" + d.state; })
            .attr("x", 0)

            .attr("y", function(d){ return y(d.state); })
            .attr("height", y.bandwidth())
            .attr("fill", "grey")
            .attr("opacity", 0.2)
            .attr("width", 0)
            .transition().duration(dur)
            .attr("width", function(d){ return x(d.threeDayPercent); })

            d3.selectAll(".ranking-rect")
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
            d3.select("#rank-rect-" + d)
                .attr("stroke", function(){ return (action == "on" ? "steelblue": "#000"); })
                .attr("stroke-width", function(){ return (action == "on" ? "3px": "0"); })
                .attr("opacity", function(){ return (action == "on" ? 1 : 0.2 ); } )
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
            d3.select("#rank-rect-" + d)
                .raise()
                .attr("fill", "#fff")
                .attr("stroke-width", 0)
                .attr("opacity", 1)
                .attr("height", y.bandwidth() * 1.5)
                .attr("y", function(){ return y(d) - y.bandwidth()/4})
                .transition().duration(dur)
                .attr("fill", color(cur_color))
                .attr("height", y.bandwidth())
                .attr("y", y(d))
            cur_color += 1;
            
        } 
    }

    function removeFromFocus(d, i){
        if (focus.includes(d)){
            const index = focus.indexOf(d);
            focus.splice(index, 1);
        }

        d3.select("#rank-rect-" + d)
            .transition().duration(dur)
            .attr("opacity", 0.2)
            .attr("fill", "grey")

    }


    rankChart.width = function(value){
        if (!arguments.length) return width;
        width = value;
        return rankChart;
    }

    rankChart.height = function(value){
        if (!arguments.length) return height;
        height = value;
        return rankChart;
    }


    rankChart.highlight = function(value, action){
        if(!arguments.length) return highlight;
        highlight = value;
        display_hover(value, action);
        return rankChart;
    }
    
    rankChart.addFocus = function(value, action){
        if(!arguments.length) return addFocus;
        if (action == "add") add2Focus(value)
        else if (action == "remove") removeFromFocus(value)
        return rankChart;
    }


    return rankChart;
}


