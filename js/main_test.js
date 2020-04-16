let full2abbrev = {};
let abbrev2full = {};
let states_vis;
let states_time_data;
let data_by_states;
let date_range;
let annotations;
var display_states = [];
var colors = [];
var text_locations = [];
var line_labels = [];
var parseTime = d3.timeParse("%Y%m%d");
var formatTime = d3.timeFormat("%m/%d/%y");

var promises = [
    d3.json("data/abbreviations.json"),
    d3.json("data/stay_at_home.json")
]

var table = document.getElementById("selection-table")

Promise.all(promises).then(ready)

var color = d3.scaleOrdinal(d3.schemeCategory10);

var sliderTime = d3.sliderBottom()
    .step(1000 * 60 * 60 * 24)
    .height(100)
    .fill('#616161')
    .width(1100)
    .step(86400000)
    .on('onchange', val=> {
        d3.select('p#value-time').text(formatTime(val));
        //sliderTime.displayValue(formatTime(val));
        update_vis();
    })

var gTime = d3.select('div#slider-time')
    .append('svg')
        .attr('width', 1500)
        .attr('height', 150)
        .append('g')
            .attr("class", "slider-tick")
            .attr('transform', 'translate(250,75)')
        

function ready([abbrev, anno]){
    var full2abbrev = {}
    const abb_entries = Object.entries(abbrev);
        for (const [key, vals] of abb_entries){
            full2abbrev[vals] = key
    }

    abbrev2full = abbrev;
    var parseDate = d3.timeParse("%m/%d/%y")
    const anno_entries = Object.entries(anno);
    for (const [key, vals] of anno_entries){
        anno[key].date = parseDate(vals.date)
    }
    annotations = anno
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
        var allStatesConfig = {
            'height':600,
            'width': 1500,
            'parseDate': parseDate,
            'state_data': states_time_data,
            'anno': anno,
            'abbrev2full': abbrev2full,
            'duration': 250,
            'selection': '#slip-chart'
        }
        states_vis = test_chart(allStatesConfig);
        init_display();
        selection_init();
        update_vis();
    }
    request.send()
}

function init_display(){
    display_states = ['NY', 'CA', 'CO', 'AK', 'MT']
    organize_data();
    //init_checkboxes();
    init_slider();
    display_states.forEach(function(d,i){
        //d3.select("#chbox_" + d).property('checked', true)
        colors[d] = color(i)
    })
}

function update_vis(){
    states_vis.curTime(sliderTime.value())
    states_vis.display_states(display_states);
    states_vis();
}

function organize_data(){
    data_by_states = d3.nest()
        .key(function(d){ return d.state; })
        .object(states_time_data)

    date_range = d3.extent(states_time_data, function(d){
        return d.date;
    })

    var x = states_vis.x(),
        y = states_vis.y()
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
            if (annotations[abbrev2full[key]].date != null){
                if (vals[i].date.getTime() == annotations[abbrev2full[key]].date.getTime()){
                    annotations[abbrev2full[key]]['binnedPositiveIncrease'] = vals[i].binnedPositiveIncrease
                    annotations[abbrev2full[key]]['positive'] = vals[i].positive
                    annotations[abbrev2full[key]]['annotation'] = {
                        'note': {
                            'label': abbrev2full[key],
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
        if (annotations[abbrev2full[key]].date == null){
            annotations[abbrev2full[key]].date = parseTime("3/19/40")
            annotations[abbrev2full[key]]['binnedPositiveIncrease'] = 'banana'
            annotations[abbrev2full[key]]['positive'] = 0
            annotations[abbrev2full[key]]['annotation'] = {
                'note': {
                    'label': abbrev2full[key],
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

        annotations[abbrev2full[key]]['line_label'] = {
            'note': {
                'label': abbrev2full[key],
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

        label1.appendChild(document.createTextNode(abbrev2full[states[i]])); 
        label2.appendChild(document.createTextNode(abbrev2full[states[i+1]])); 
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

        checkbox1.addEventListener("mouseenter", console.log("mouseenter"))
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
        test_annotations.push(annotations[abbrev2full[d]].annotation)
        colors[d] = color(i)
    })
    update_vis();
}

function selection_init(){
    var selectionConfig = {
        'height':700,
        'width': 300,
        'selection': '#state-selection'
    }
    var selection_vis = stateSelector(selectionConfig);
    selection_vis.states(d3.keys(data_by_states))
    selection_vis();
}