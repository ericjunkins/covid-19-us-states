
let full2abbrev = {};
let abbrev2full = {};
let states_vis;
let states_time_data;
var parseTime = d3.timeParse("%Y%m%d");
var formatTime = d3.timeFormat("%m/%d/%y");
var display_states = ['NY', 'CA', 'CO', 'AK', 'MT'];

var promises = [
    d3.json("data/abbreviations.json"),
    d3.json("data/stay_at_home.json")
]

Promise.all(promises).then(ready)

var sliderTime = d3.sliderBottom()
    .step(1000 * 60 * 60 * 24)
    .height(100)
    .fill('#616161')
    .width(1500)
    .step(86400000)
    .on('onchange', val=> {
        d3.select('p#value-time').text(formatTime(val));
        //sliderTime.displayValue(formatTime(val));
        update_vis();
    })

var gTime = d3.select('div#slider-time')
    .append('svg')
        .attr('width', 1800)
        .attr('height', 150)
        .append('g')
            .attr("class", "slider-tick")
            .attr('transform', 'translate(250,75)')


function ready([abbrev2full, anno]){
    var full2abbrev = {}
    const abb_entries = Object.entries(abbrev2full);
        for (const [key, vals] of abb_entries){
            full2abbrev[vals] = key
    }

    var parseDate = d3.timeParse("%m/%d/%y")
    const anno_entries = Object.entries(anno);
    for (const [key, vals] of anno_entries){
        //console.log(key, entries)
        anno[key].date = parseDate(vals.date)
    }

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
            'width': 1800,
            'abbrev2full': abbrev2full,
            'annotations': anno,
            'parseDate': parseDate,
            'state_data': states_time_data,
            'duration': 250,
            'selection': '#slip-chart'
        }

        states_vis = states_chart(allStatesConfig)
        //states_vis();
    }
    request.send()
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

function update_vis(){
    var data_list = []
    var sah_dots = []
    display_states.forEach(function(d,i){
        var res = data_by_states[d].filter(function(v){
            return v.date < sliderTime.value();
        })
        if (res.length != 0){
            data_list.push(res)
        }
        // if (sah_data[abbrev2full[d]].date <= sliderTime.value()){
        //     var x = sah_data[abbrev2full[d]].positive
        //     var y = sah_data[abbrev2full[d]].binnedPositiveIncrease
        //     sah_dots.push({'x': x, 'y': y, 'state': d})
        // }
    })
    states_vis.data_list(data_list)
    states_vis();
}


