var today = new Date(); 
var hour = d3.utcFormat("%H")
var zone = d3.timeFormat("%Z")
var fullDate = d3.timeFormat("%m/%d/%y")

var fixed = hour(today)
offset = +zone(today)/100

if (+fixed -4 <= 16) {
    tmp = fullDate(d3.timeHour.offset(today, -24))
    tmpHour = offset+ 4 + 16
    t = (tmp + " "  + tmpHour + ":00")
    
} else {
    tmp = fullDate(today)
    tmpHour = offset + 4 + 16
    t = (tmp + " " + tmpHour + ":00")
}

d3.select("#updated-time").text(t)