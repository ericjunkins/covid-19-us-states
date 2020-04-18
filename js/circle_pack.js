function circlePack(config){
    var margin = { left:20, right:20, top:20, bottom:20 }
    var height = config.height - margin.top - margin.bottom, 
        width = config.width - margin.left - margin.right,
        selection = config.selection,
        states_data = config.states_data,
        full2abbrev = config.full2abbrev,
        anno = config.anno,
        regions = config.regions
        severitySelector = "cases"
        chart_data = [];


    // append the svg object to the body of the page
    var svg = d3.select(selection)
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    

    function circlePack(){
        var colors = d3.scaleOrdinal()
            .domain(['states', 'Northeast', 'Midwest', "West", "South"])
            .range(['none', '#fcba03', '#03fc0b', '#fc03f0', '#1403fc'])

        var a = d3.scaleLinear()
            .range([0, 50])

        var stratify = d3.stratify()
            .id(d => d.id)
            .parentId(d => d.parentId)
        data_by_states = d3.nest()
            .key(function(d){ return d.state; })
            .object(states_time_data)
        
        
        const entries = Object.entries(anno);
        for (const [key, vals] of entries){
            if (vals.date != undefined){
                var tmp = data_by_states[full2abbrev[key]]
                var arr = tmp.filter(function(d){
                    return d.date.getTime() == vals.date.getTime()
                })
            }
            chart_data.push({
                'state': key,
                'date': arr[0].date,
                'cases': arr[0].positive
            })
        }

        regions.forEach(function(d){
            chart_data.forEach(function(v){
                if (full2abbrev[v.state] == d.id){
                    d['severity'] = v.positive
                }
            })
        })
        var vData = stratify(regions)
        var vLayout = d3.pack().size([250, 500])

        var vRoot = d3.hierarchy(vData).sum(function(d){ return d.data[severitySelector]})
        var vNodes = vRoot.descendants();
        vLayout(vRoot)

        var vSlices = svg.selectAll('circle')
            .data(vNodes)
            
            
        vSlices.enter()
            .append('circle')
            .attr("class", "circle-packs")
            .attr("cx", function(d){ return d.x; })
            .attr("cy", function(d){ return d.y; })
            .attr("r",  function(d){ return d.r; })
            .attr("fill", function(d){
                return colors(d.data.data.parentId)
            })

        var max_num = d3.max(chart_data, function(d){ return d.positive; })
        a.domain([0, area2radius(max_num)])

        //draw_circles();
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

    circlePack.width = function(value){
        if (!arguments.length) return width;
        width = value;
        return circlePack;
    }

    circlePack.height = function(value){
        if (!arguments.length) return height;
        height = value;
        return circlePack;
    }

    circlePack.states = function(value){
        if (!arguments.length) return states;
        states = value;
        return circlePack;  
    }

    circlePack.colors = function(value){
        if (!arguments.length) return colors;
        colors = value;
        return circlePack;  
    }

    circlePack.anno = function(value){
        if (!arguments.length) return anno;
        anno = value;
        return circlePack;  
    }
    
    
    return circlePack;
}


