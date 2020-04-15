
let states_time_data;
let data_by_states;
let data_list;
let date_range;
let states;
let abbrev;
let full = {};
let colors = {};
var display_states;
let text_locations = [];
let test_annotations = [];
let line_labels = [];
let sah_dots = [];
let sah_data = {};
var parseTime = d3.timeParse("%Y%m%d");
var parseDate_sah = d3.timeParse("%m/%d/%y")
var formatTime = d3.timeFormat("%m/%d/%y");

let node_template = {'index': 0, 'x': 0, 'y': 0, 'vx': 0, 'vy': 0}
let nodes = [];
let links = [];

var margin = { left:100, right:100, top:50, bottom:80 },
    height = 600 - margin.top - margin.bottom, 
    width = 1800 - margin.left - margin.right;

// append the svg object to the body of the page
var svg = d3.select("#chart-area")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var text_g = svg.append("g")

var x = d3.scaleLog()
    .domain([1, 1000000])
    .range([0,width])
      
var y = d3.scaleLog()
    .domain([1, 100000])
    .range([height, 0])

var color = d3.scaleOrdinal(d3.schemeCategory10);

var x_axis = d3.axisBottom(x).ticks(10, ",.1d")
var y_axis = d3.axisLeft(y).ticks(8, ",.1d")

svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .attr("class", "axis axis--x axisWhite")
    .call(x_axis);

svg.append("g")
    .attr("class", "axis axis--y axisWhite")
    .call(y_axis)

    svg.append("text")
    .attr("class", "axis-text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height/2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .attr("font-size", "2rem")
    .text("New Confirmed Cases (in the Past Week)")

svg.append("text")
    .attr("class", "axis-text")
    .attr("transform", "translate(0," + height + ")")
    .attr("y", margin.bottom/2)
    .attr("x",(width/2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .attr("font-size", "2rem")
    .text("Total Confirmed Cases")



dots = svg.append('g')
circ = svg.append('g')
line = d3.line()
    .x(function(d){ 
        var val = (d.positive == 0 ? 1 : d.positive)
        return x(val); })
    .y(function(d){
        if (d.binnedPositiveIncrease < 1){
            d.binnedPositiveIncrease = 1
        }
        var val = (d.binnedPositiveIncrease == 0 ? 1 : d.binnedPositiveIncrease)
        return y(val)
    })
    //.curve(d3.curveBasis)
    .curve(d3.curveCardinal.tension(0.5))

var sliderTime = d3.sliderBottom()
    .step(1000 * 60 * 60 * 24)
    .height(100)
    .fill('#616161')
    .width(1500)
    .step(86400000)
    .on('onchange', val=> {
        d3.select('p#value-time').text(formatTime(val));
        //sliderTime.displayValue(formatTime(val));
        update_display_data();
    })

var gTime = d3.select('div#slider-time')
    .append('svg')
        .attr('width', 1800)
        .attr('height', 150)
        .append('g')
            .attr("class", "slider-tick")
            .attr('transform', 'translate(250,75)')


var table = document.getElementById("selection-table")

d3.json("data/abbreviations.json").then(function(data){
    abbrev = data
    const entries = Object.entries(data);
        for (const [key, vals] of entries){
        full[vals] = key
    }
})

d3.json("data/stay_at_home.json").then(function(data){
    const entries = Object.entries(data);
    for (const [key, vals] of entries){
        //console.log(key, entries)
        data[key].date = parseDate_sah(vals.date)
    }
    sah_data = data;
})

var makeAnnotations = d3.annotation()
    .type(d3.annotationLabel)

var line_annotations = d3.annotation()
    .type(d3.annotationLabel)

d3.select("svg")
    .append("g")
        .attr("class", "annotation-group")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(makeAnnotations)
d3.select("svg")
    .append("g")
        .attr("class", "line-labels")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(line_annotations)

get_states_data()
function get_states_data(){
    var request = new XMLHttpRequest()
    request.open("GET", "https://covidtracking.com/api/states/daily", true)
    request.onload = function(){ 
        states_time_data = JSON.parse(this.response)
        
        states_time_data.forEach(function(d){
            d.date = parseTime(d.date)
            if(d.positive == null) { d.positive = 0}
            if(d.negative == null) { d.negative = 0}
            if(d.positiveIncrease == null) { d.positiveIncrease = 0}
            if(d.negativeIncrease == null) { d.negativeIncrease = 0}
            if(d.hospitalized == null) { d.hospitalized = 0}
            if(d.hospitalizedIncrease == null){d.hospitalizedIncrease = 0}
            if(d.deathIncrease == null){d.deathIncrease = 0}
            if(d.totalTestResultsIncrease == null){d.totalTestResultsIncrease = 0}
            if(d.death == null){d.death = 0}
            if(d.pending == null){d.pending = 0}
        })

        organize_data();
        init_display();
        update_display_data();
    }
    request.send()
}

function init_display(){
    init_checkboxes()
    init_slider()
    display_states = ['NY', 'CA', 'CO', 'AK', 'MT']
    display_states.forEach(function(d,i){
        d3.select("#chbox_" + d).property('checked', true)
        colors[d] = color(i)
    })
}

function init_checkboxes(){
    states = d3.keys(data_by_states);
    for (var i=0; i< states.length; i +=2){
        var checkbox1 = document.createElement('input');
        var checkbox2 = document.createElement('input');
        var table_row = table.insertRow(-1)
        var cell1 = table_row.insertCell(0);
        var cell2 = table_row.insertCell(1);
        checkbox1.setAttribute("class", "c")
        checkbox2.setAttribute("class", "c")
        checkbox1.type = "checkbox";
        checkbox2.type = "checkbox";
        checkbox1.name = states[i];
        checkbox2.name = states[i+1];
        checkbox1.checked = false;
        checkbox2.checked = false;
        checkbox1.value = 0;
        checkbox2.value = 0;
        checkbox1.id = "chbox_" + states[i]
        checkbox2.id = "chbox_" + states[i+1]

        cell1.appendChild(checkbox1);
        cell2.appendChild(checkbox2);
        // // creating label for checkbox 
        var label1 = document.createElement('label'); 
        var label2 = document.createElement('label');  
        // // assigning attributes for  
        // // the created label tag  
        label1.htmlFor = "id"; 
        label2.htmlFor = "id"; 

        label1.appendChild(document.createTextNode(abbrev[states[i]])); 
        label2.appendChild(document.createTextNode(abbrev[states[i+1]])); 
        cell1.appendChild(label1)
        cell2.appendChild(label2)
        
        checkbox1.addEventListener('change', (event) => {
            var action = (event.target.checked ? 'add' : 'remove')
            update_display_states(event.target.name, action)
          })
        checkbox2.addEventListener('change', (event) => {
            var action = (event.target.checked ? 'add' : 'remove')
            update_display_states(event.target.name, action)

          })
    }
}

function init_slider(){
    date_range = d3.extent(states_time_data, function(d){
        return d.date;
    })

    sliderTime
        .min(date_range[0])
        .max(date_range[1])
        .ticks(data_by_states["NY"].length/2)
        .default(date_range[0])

    gTime.call(sliderTime);
    d3.select('p#value-time').text(formatTime(sliderTime.value()));
    console.log(sliderTime.height())
}

function organize_data(){
    data_by_states = d3.nest()
            .key(function(d){ return d.state})
            .object(states_time_data)

    date_range = d3.extent(states_time_data, function(d){
        return d.date;
    })

    const entries = Object.entries(data_by_states);
    for (const [key, vals] of entries){
        var window = []
        
        for (var i = vals.length-1; i >= 0; i--){
            window.push(vals[i].positiveIncrease)
            if (window.length >4){
                window.shift()
            }
            var total = (window.length == 1 ? window[0] : d3.sum(window) )
            data_by_states[key][i]['binnedPositiveIncrease'] = total
            if (sah_data[abbrev[key]].date != null){
                if (vals[i].date.getTime() == sah_data[abbrev[key]].date.getTime()){
                    sah_data[abbrev[key]]['binnedPositiveIncrease'] = vals[i].binnedPositiveIncrease
                    sah_data[abbrev[key]]['positive'] = vals[i].positive
                    sah_data[abbrev[key]]['annotation'] = {
                        'note': {
                            'label': abbrev[key],
                            'title': 'Stay at home order issued: ' + formatTime(vals[i].date)
                        },      
                        'connector': {
                            'end': "dot",
                            'endScale': 8
                        },
                        'disable': [],
                        'x': x(vals[i].positive),
                        'y': y(vals[i].binnedPositiveIncrease),
                        'dy': -75,
                        'dx': -75
                    }
                }
            }
        }
        if (sah_data[abbrev[key]].date == null){
            sah_data[abbrev[key]].date = parseDate_sah("3/19/40")
            sah_data[abbrev[key]]['binnedPositiveIncrease'] = 'banana'
            sah_data[abbrev[key]]['positive'] = 0
            sah_data[abbrev[key]]['annotation'] = {
                'note': {
                    'label': abbrev[key],
                    'title': 'None' 
                },
                'subject': {
                    'radius': 15,
                    'stroke': 10
                },
                'connector': {
                    'end': "dot",
                    'endScale': 1
                },
                'disable': ['subject, note, connector'],
                'x': -1000,
                'y': -1000,
                'dy': -50,
                'dx': -50
            }
        }

        sah_data[abbrev[key]]['line_label'] = {
            'note': {
                'label': abbrev[key],
            },
            'connector': {
                'end': "dot",
                'endScale': 2
            },

            'disable': ["subject", "connector"],
            'x': x(1),
            'y': y(1),
            'dy': 0,
            'dx': 60
        }
    }
}

function update_display_states(state, action){
    colors = {}
    if (action == "add"){
        display_states.push(state)
    } else {
        const index = display_states.indexOf(state)
        display_states.splice(index, 1)
    }
    test_annotations = []
    display_states.forEach(function(d, i){
        test_annotations.push(sah_data[abbrev[d]].annotation)
        colors[d] = color(i)
    })
    update_display_data()
}

function update_display_data(){
    data_list = []
    sah_dots = []
    display_states.forEach(function(d,i){
        var res = data_by_states[d].filter(function(v){
            return v.date < sliderTime.value();
        })
        if (res.length != 0){
            data_list.push(res)
        }
        if (sah_data[abbrev[d]].date <= sliderTime.value()){
            var x = sah_data[abbrev[d]].positive
            var y = sah_data[abbrev[d]].binnedPositiveIncrease
            sah_dots.push({'x': x, 'y': y, 'state': d})
        }
    })
    draw_chart(data_list)
}

function draw_chart(data){
    draw_paths()
    draw_leading_dots();
    draw_sah_dots();
    draw_line_labels();
}

function draw_paths (){
    lines = svg.selectAll(".line")
        .data(data_list, function(d){ return d[0].state })
        .on("mousemove", moved)
        .on("mouseenter", entered)
        .on("mouseleave", leave)
        .on("click", entered)

    lines.exit().remove()

    lines
        .attr("fill", "none")
        .attr("id", function(d){
            "path_" + d.state; 
        })
        .attr("opacity", 1)
        .attr("stroke", function(d,i){ return color(i); })
        .attr("stroke-width", 3)
        .attr("d", function(d){ return line(d); });

    lines.enter()
        .append("path")
            .attr("class", "line")
            .attr("opacity", 1)
            .attr("id", function(d){
                "path_" + d.state; 
            })
            .attr("fill", "none")
            .attr("stroke", function(d,i){ return color(i); })
            .attr("stroke-width", 3)
            .attr("d", function(d){ return line(d) });

}

function draw_line_labels(){
    text_locations = []
    line_labels = []
    data_list.forEach(function(d, i){
        var tmp = sah_data[abbrev[d[0].state]]['line_label']
        tmp['x'] = x((d[0].positive == 0 ? 1 : d[0].positive))
        tmp['y'] = y(d[0].binnedPositiveIncrease == 0 ? 1 : d[0].binnedPositiveIncrease)
        tmp['color'] = color(i)

        text_locations.push(d[0])
        line_labels.push(tmp)

    })

    line_annotations
        .type(d3.annotationLabel)
        .annotations(line_labels)

}

function draw_sah_dots (){
    dot = dots.selectAll("circle")
        .data(sah_dots, function(d){ return d.state})

    dot.exit().remove()

    dot
        .style('fill', function(d,i){ return colors[d.state]; })
        .attr("opacity", 1)
        .attr('cx', function(d){ return x((d.x == 0 ? 1 : d.x))})
        .attr("cy", function(d){ return y((d.y == 0 ? 1 : d.y))})
        .attr("r", 8.5)

    dot.enter()
        .append("circle")
        .attr("opacity", 1)
        .style('fill', function(d,i){ return colors[d.state]; })
        .attr('cx', function(d){ return x((d.x == 0 ? 1 : d.x))})
        .attr("cy", function(d){ return y((d.y == 0 ? 1 : d.y))})
        .attr("r",40)
        .transition().duration(750)
            .attr("r", 8.5)
}

function draw_leading_dots(){
    circles = circ.selectAll("circle")
        .data(text_locations, function(d){ return d.state})

    circles.exit().remove()

    circles
        .style('fill', function(d,i){ return color(i)})
        .attr('cx', function(d){ return x((d.positive == 0 ? 1 : d.positive))})
        .attr("cy", function(d){ return y((d.binnedPositiveIncrease == 0 ? 1 : d.binnedPositiveIncrease))})
        .attr("r", 3)

    circles.enter()
        .append("circle")
        .style('fill', function(d,i){ return color(i)})
        .attr('cx', function(d){ return x((d.positive == 0 ? 1 : d.positive))})
        .attr("cy", function(d){ return y((d.binnedPositiveIncrease == 0 ? 1 : d.binnedPositiveIncrease))})
        .attr("r", 3)
}

function moved (d){
    //console.log('moved', d3.event)
}

function entered (d,i){
    svg.selectAll(".line")
        .attr("stroke", "#e0e0e0")
        .attr("opacity", function(v,j){
            return (j == i ? 1 : 0.5)
        })
        .attr("stroke-width", 1)

    dots.selectAll("circle")
        .style("fill", function(v,j){
            return (j == i ? color(i) : '#e0e0e0')
        })
        .attr("opacity", function(v,j){
            return (j == i ? 1 : 0.5)
        })
        .attr("r", 3)

    circ.selectAll("circle")
        .style("fill", function(v,j){
            return (j == i ? color(i) : '#e0e0e0')
        })
        .attr("opacity", function(v,j){
            return (j == i ? 1 : 0.5)
        })
    
    d3.select(this)
        .attr("stroke-width", 6.5)
        .attr("stroke", color(i))

    if (sah_data[abbrev[d[0].state]].date <= sliderTime.value()){
        tmp = sah_data[abbrev[d[0].state]].annotation
        tmp.color = color(i)
        makeAnnotations
            .type(d3.annotationCallout)
            .annotations([tmp])
    }

    var tmp = sah_data[abbrev[d[0].state]]['line_label']
    tmp['x'] = x((d[0].positive == 0 ? 1 : d[0].positive))
    tmp['y'] = y(d[0].binnedPositiveIncrease == 0 ? 1 : d[0].binnedPositiveIncrease)
    tmp['color'] = color(i)

    line_annotations
        .type(d3.annotationLabel)
        .annotations([tmp])

}   

function leave (){
    draw_leading_dots();
    draw_paths();
    draw_sah_dots();
    draw_line_labels();
    makeAnnotations
        .type(d3.annotationLabel)
        .annotations([])

}


