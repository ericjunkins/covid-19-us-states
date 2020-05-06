function bubbleOrders_chart(config){
    var margin = { left:120, right:50, top:50, bottom: 80 }
        chartData = config.data,
        markerData = config.marker,
        raw_orders = config.raw_orders,
        full2abbrev = config.full2abbrev;
        dur = config.duration,
        orders = config.order,
        defaultColor = config.defaultColor,
        defaultOpacity = config.defaultOpacity*0.5

    var ordersFocus = []
    var getDateObj = d3.timeParse("%m/%d/%y");
    var today = new Date();
    var color = d3.scaleOrdinal(config.scheme);
    var cur_color = 0
    var rad = 4,
        strokeWidth = 2
    var height = config.height - margin.top - margin.bottom, 
        width = config.width - margin.left - margin.right;
    

    var svg = d3.select(config.selection)
        .append("svg")
            .attr("width", width + margin.right + margin.left)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", "translate(" + (0 + margin.left) + "," + margin.top + ")")
    
                
    ordersDate = [];
    nodes_data = [];
    var link_data = []
    const entries = Object.entries(orders)
    for (const [key, vals] of entries){
        tmp = vals.orders.filter(function(d){ return d.date != "" && getDateObj(d.date) <= today})
        tmp.forEach(function(d, i){
            if (! ordersDate.includes(d.date) && d.date != "") ordersDate.push(d.date)
            d.state = key
            d.name = key + "-" + i
            if (d.date != "") {
                if (getDateObj(d.date) <= today) nodes_data.push(d)
                
            }
            if (i == 0){
                link_data.push({
                   "source": "master",
                   "target": d.name,
                   'state': key
                })
            }
            if (i < tmp.length - 1){
                link_data.push({
                    "source": d.name,
                    "target": key + "-" + (i+1),
                    'state': key
                })
            } else {
                link_data.push({
                    "source": d.name,
                    "target": "end-" + d.order,
                    'state': key
                })
            }

        })
    }

    

    sorted = ordersDate.sort(function(a,b){
        return d3.ascending(a,b)
    })

    Date.prototype.addDays = function(days) {
        var date = new Date(this.valueOf());
        date.setDate(date.getDate() + days);
        return date;
    }

    function getDates(startDate, stopDate) {
        var dateArray = new Array();
        var currentDate = startDate;
        while (currentDate <= stopDate) {
            dateArray.push(new Date (currentDate));
            currentDate = currentDate.addDays(1);
        }
        return dateArray;
    }

    
    
    var dateArray = getDates(
        d3.timeDay.offset(getDateObj(sorted[0]), -3), 
        d3.timeDay.offset(today, 1)
    )

    var dateArrayStrings = [];

    dateArray.forEach(function(d){
        dateArrayStrings.push(formatTime(d));
    })

    
    nodes_data.push(
        {
            'date': dateArrayStrings[0],
            'order': '5',
            'name': 'master'
        },
        {
            'date': dateArrayStrings[dateArrayStrings.length-1],
            'order': '0',
            'name': 'end-0'
        },
        {
            'date': dateArrayStrings[dateArrayStrings.length-1],
            'order': '1',
            'name': 'end-1'
        },
        {
            'date': dateArrayStrings[dateArrayStrings.length-1],
            'order': '2',
            'name': 'end-2'
        },
        {
            'date': dateArrayStrings[dateArrayStrings.length-1],
            'order': '3',
            'name': 'end-3'
        },
        {
            'date': dateArrayStrings[dateArrayStrings.length-1],
            'order': '4',
            'name': 'end-4'
        },
        {
            'date': dateArrayStrings[dateArrayStrings.length-1],
            'order': '5',
            'name': 'end-5'
        }

    )


    var yBand = d3.scaleBand()
        .domain(['0', '1', '2', '3', '4', '5'])
        .range([0, height])

    var x = d3.scaleBand()
        .domain(dateArrayStrings)
        .range([0, width])
        .padding(0.05)



    var x_axis = d3.axisBottom(x).tickValues(x.domain().filter(function(d,i){ return !(i%7)})).tickPadding(10)
    var y_axis = d3.axisLeft(yBand)

    var labels = svg.append("g")
    
    labels.append("g")
        .attr("class", "axis axis--y axisWhite")
        .call(y_axis)

    labels.append("g")
        .attr("class", "axis axis--y axisWhite")
        .attr("transform", "translate(0," + height + ")")
        .call(x_axis)

    var simulation = d3.forceSimulation()
        .force("forceX", d3.forceX().strength(0.5).x(function(d){
            return x(d.date)
        }))
        .force("forceY", d3.forceY().strength(0.2).y(function(d){
            return yBand(d.order) + yBand.bandwidth()/2
        }))
        .force("collide", d3.forceCollide().strength(0.2).radius(rad * 1.2).iterations(10))
        .nodes(nodes_data);

 



    var link_force =  d3.forceLink(link_data).strength(0)
        .id(function(d) { return d.name; })

    simulation.force("link_data",link_force)

    var link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(link_data)
        .enter()
            .append("line")
                .on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseout", mouseout)
                .on("click", clicked)
            .attr("id", function(d){ return "order-path-" + d.state; })
            .attr("stroke", defaultColor)
            .attr("stroke-width", strokeWidth)
            .attr("opacity", defaultOpacity/2)

    var node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(nodes_data)
        .enter()
            .append("circle")
                .on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseout", mouseout)
                .on("click", clicked)
            .attr("id", function(d){ return "order-dot-" + d.state; })
            .attr("r", rad)
            .attr("fill", defaultColor)
            .attr("opacity", defaultOpacity)

    simulation.on("tick", tickActions );

    function ordersChart(){
        draw_chart();
    }

    function draw_chart(){
        //simulation.stop();
    }

    function tickActions(){
        node
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });

        link
            .attr("x1", function(d) {
                return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });
    }

    function mouseover(d){
        update_highlight(d.state, 'on')
        document.body.style.cursor = "pointer"
    }

    function mousemove(d){

    }

    function mouseout(d){
        update_highlight(d.state, 'off')
        document.body.style.cursor = "default"
    }

    function display_hover(d, action){
        if (!ordersFocus.includes(d)){
            d3.selectAll("#order-dot-" + d)
                .attr("opacity", function(){ return (action == "on" ? 1 : defaultOpacity); })

            d3.selectAll("#order-path-" + d)
                .attr("opacity", function(){ return (action == "on" ? 1 : defaultOpacity/2); })
        }
    }

    function clicked(d){
        if (ordersFocus.includes(d.state)) update_focus(d.state, "remove")
        else update_focus(d.state, "add")
    }
  
    function add2Focus(d, i){
        if (!ordersFocus.includes(d)){
            ordersFocus.push(d)
            d3.selectAll("#order-dot-" + d)
                .raise()
                .attr("r", rad * 2)
                .attr("fill", "#fff")
                .attr("opacity", 1)
                .transition().duration(dur)
                .attr("r", rad)
                .attr("fill", color(cur_color))

            d3.selectAll("#order-path-" + d)
                .raise()
                .attr("stroke", "#fff")
                .attr("stroke-width", (strokeWidth*4))
                .attr("opacity", 1)
                .transition().duration(dur)
                .attr("stroke", color(cur_color))
                .attr("stroke-width", strokeWidth*2)
            cur_color += 1;
        }
    }

    function removeFromFocus(d, i){
        if (ordersFocus.includes(d)){
            const index = ordersFocus.indexOf(d);
            ordersFocus.splice(index, 1);
        }

        d3.selectAll("#order-dot-" + d)
            .attr("r", rad * 2)
            .attr("fill", "#fff")
            .transition().duration(dur/2)
            .attr("r", rad)
            .attr("opacity", defaultOpacity)
            .attr("fill", defaultColor)

        d3.selectAll("#order-path-" + d)
            .attr("stroke", "#fff")
            .attr("stroke-width", strokeWidth*4)
            .transition().duration(dur/2)
            .attr("opacity", defaultOpacity/2)
            .attr("stroke", defaultColor)
            .attr("stroke-width", strokeWidth)
  
    }

    function removeAll(){
        ordersFocus.forEach(function(d){
            d3.selectAll("#order-dot-" + d)
                .attr("r", rad * 2)
                .attr("fill", "#fff")
                .transition().duration(dur/2)
                .attr("r", rad)
                .attr("opacity", defaultOpacity)
                .attr("fill", defaultColor)

            d3.selectAll("#order-path-" + d)
                .attr("stroke", "#fff")
                .attr("stroke-width", strokeWidth*4)
                .transition().duration(dur/2)
                .attr("opacity", defaultOpacity/2)
                .attr("stroke", defaultColor)
                .attr("stroke-width", strokeWidth)
        })
        ordersFocus = [];

    }

    ordersChart.width = function(value){
        if (!arguments.length) return width;
        width = value;
        return ordersChart;
    }

    ordersChart.height = function(value){
        if (!arguments.length) return height;
        height = value;
        return ordersChart;
    }

    ordersChart.F = function(value){
        if(!arguments.length) return x;
        x = value;
        return ordersChart;
    }

    ordersChart.y = function(value){
        if(!arguments.length) return y;
        y = value;
        return ordersChart;
    }

    ordersChart.display_states = function(value){
        if(!arguments.length) return display_states;
        display_states = value;
        update_display_data();
        return ordersChart;
    }

    ordersChart.highlight = function(value, action){
        if(!arguments.length) return highlight;
        highlight = value;
        display_hover(value, action);
        return ordersChart;
    }  

    ordersChart.addFocus = function(value, action){
        if(!arguments.length) return addFocus;
        if (action == "add") add2Focus(value)
        else if (action == "remove") removeFromFocus(value)
        else if (action == "removeAll") removeAll()
        return ordersChart;
    }

    return ordersChart;
}


