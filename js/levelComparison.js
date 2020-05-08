function groupedBar_chart(config){
    var margin = { left:70, right:20, top:30, bottom:70 }
        chartData = config.data,
        markerData = config.marker,
        raw_orders = config.raw_orders,
        full2abbrev = config.full2abbrev;
        dur = config.duration,
        order = config.order,
        defaultColor = config.defaultColor,
        defaultOpacity = config.defaultOpacity*0.5

    var groupedBarFocus = []
    var orderLevels= ["0", "1", "2", "3", "4", "5"]
    var color = d3.scaleOrdinal(config.scheme);
    var cur_color = 0
    var height = config.height - margin.top - margin.bottom, 
        width = config.width - margin.left - margin.right;
    
    // append the svg object to the body of the page
    var svg = d3.select(config.selection)
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    



    var getDateObj = d3.timeParse("%m/%d/%y");
    var today = new Date();
    var minDate = "03/07/20"

    groupedBarData = []

    var entries = Object.entries(order)
    for (const [key, val] of entries){
        prevDate = minDate
        prevOrder = "5"
        val.orders.forEach(function(d){
            if (d.date != "" && getDateObj(d.date) <= today){
                diff = getDateDiff(prevDate, d.date)
                prevDate = d.date
                groupedBarData.push({
                    'state': key,
                    'order': prevOrder,
                    'count': diff,
                    'id': key + "-" + d.order
                })
                prevOrder = d.order

            }
        })
    }


    var states = d3.keys(order)
    states.forEach(function(d){
        stateData = groupedBarData.filter(v=>v.state == d).map(d=> d.order)
        orderLevels.forEach(function(k){
            if (!stateData.includes(k)){
                groupedBarData.push({'state': d, 'order': k, 'count': 0, 'id': d + '-' + k})
            }
        })
    })

    function getDateDiff(a,b){
        return Math.round((getDateObj(b) - getDateObj(a))/ (1000*60*60*24))
    }

    var filteredData

    var xLevel = d3.scaleBand()
        .domain(orderLevels)
        .range([0, width])
        .padding(0.2)

    var xState = d3.scaleBand()
        .range([0, xLevel.bandwidth()])
        .padding(0.1)
    
    var y = d3.scaleLinear()
        .range([height, 0])

    
    var x_axis = d3.axisBottom(xLevel)
    var y_axis = d3.axisLeft(y)

    var labels = svg.append("g")
        .attr("class", "labels")

    var xAxisCall = labels.append("g")
        .attr("class", "axis axis--y axisWhite")
        .attr("transform", "translate(0," + height + ")")
        .call(x_axis)

    var yAxisCall = labels.append("g")
        .attr("class", "axis axis--y axisWhite")
        

    var chart = svg.append("g")
        .attr("class", "charts")

    function groupBarChart(){
        updateScales();
        draw_chart();
    }
    
    function updateScales(){
        xState.domain(groupedBarFocus)
        filteredData = groupedBarData.filter(d=> groupedBarFocus.includes(d.state))
        maxCount = d3.max(filteredData, d=> d.count)
        y.domain([-1, maxCount])
        y_axis.ticks(5)
        yAxisCall
            .transition().duration(dur)
            .call(y_axis).transition().duration(dur)

    }

    svg.append("g").selectAll("bg-rect")
        .data(xLevel.domain())
        .enter()
        .append("rect")
        .attr("x", d=> xLevel(d))
        .attr("y", 0)
        .attr("width", xLevel.bandwidth())
        .attr("height", height)
        .attr("fill", "grey")
        .attr("opacity", 0.05)


    function draw_chart(){
        var rects = chart.selectAll("rect")
            .data(filteredData, d=>d.id)

        rects.exit()
            .transition().duration(dur)
                .attr("y", height)
                .attr("height", 0)
            .remove()

        
        rects
            .transition().duration(dur)
                .attr("x", function(d){ return xLevel(d.order) + xState(d.state) })
                .attr("width", xState.bandwidth())
                .attr("y", d=> y(d.count))
                .attr("height", d=> y(-1) - y(d.count))

        rects.enter()
            .append("rect")
            .attr("id", d=> "diff-rect-" + d)
            .attr("x", function(d){ return xLevel(d.order) + xState(d.state) })
            .attr("width", xState.bandwidth())
            .attr("y", y(-1))
            .attr("height", 0)
            .attr("fill", "#fff")
            .transition().duration(dur)
                .attr("fill", color(cur_color))
                .attr("y", function(d){
                    return  y(d.count)
                })
                .attr("height", d=> y(-1) - y(d.count))
    }
    
    function mouseover(d){

        document.body.style.cursor = "pointer"
    }

    function mousemove(d){

    }

    function mouseout(d){

        document.body.style.cursor = "default"
    }

    function display_hover(d, action){

    }

    function clicked(d){
    }
  
    function add2Focus(d, i){
        if (!groupedBarFocus.includes(d)){
            groupedBarFocus.push(d)
            updateScales();
            draw_chart();
            cur_color += 1;
        }

    }

    function removeFromFocus(d, i){
        if (groupedBarFocus.includes(d)){
            const index = groupedBarFocus.indexOf(d);
            groupedBarFocus.splice(index, 1);
        }
        updateScales();
        draw_chart();
    }

    function removeAll(){
        groupedBarFocus = [];
        updateScales();
        draw_chart();
    }

    groupBarChart.width = function(value){
        if (!arguments.length) return width;
        width = value;
        return groupBarChart;
    }

    groupBarChart.height = function(value){
        if (!arguments.length) return height;
        height = value;
        return groupBarChart;
    }

    groupBarChart.x = function(value){
        if(!arguments.length) return x;
        x = value;
        return groupBarChart;
    }

    groupBarChart.y = function(value){
        if(!arguments.length) return y;
        y = value;
        return groupBarChart;
    }

    groupBarChart.display_states = function(value){
        if(!arguments.length) return display_states;
        display_states = value;
        update_display_data();
        return groupBarChart;
    }

    groupBarChart.highlight = function(value, action){
        if(!arguments.length) return highlight;
        highlight = value;
        display_hover(value, action);
        return groupBarChart;
    }  

    groupBarChart.addFocus = function(value, action){
        if(!arguments.length) return addFocus;
        if (action == "add") add2Focus(value)
        else if (action == "remove") removeFromFocus(value)
        else if (action == "removeAll") removeAll()
        return groupBarChart;
    }

    return groupBarChart;
}


