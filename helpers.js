'use strict'

let companiesMatch = function (search, company) {
    var searched = search.replace(/\s/g, '').toLowerCase()
    var employer = company.replace(/\s/g, '').toLowerCase()
    return employer.includes(searched) || searched.includes(employer)
}

let formatTime = function (start, end) {
    var newStart;
    var startHalf = 'am'
    var newEnd;
    var endHalf = 'am'
    if (start.slice(0, 2) > 12) {
        newStart = (start.slice(0,2) % 12) + start.slice(2)
        startHalf = 'pm'
    } else {
        newStart = start
    }
    if (end.slice(0, 2) > 12) {
        newEnd = (end.slice(0,2) % 12) + end.slice(2)
        endHalf = 'pm'
    } else {
        newEnd = end
    }
    return newStart + startHalf + ' - '  + newEnd + endHalf
}

let codeToTermMap = {
    1199: "Fall 2019",
    1201: "Winter 2020"
}

module.exports = {
    companiesMatch: companiesMatch,
    formatTime: formatTime,
    codeToTermMap: codeToTermMap
}