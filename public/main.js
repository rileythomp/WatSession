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

var app = angular.module('watSession', []);

app.controller('appCtrlr', function($scope, $http) {

    $('.intervalDate').pickadate({ format: 'mmm d, yyyy' })
	var startPicker = $('#intervalStart').pickadate('picker')
    var endPicker = $('#intervalEnd').pickadate('picker')
    startPicker.set({min: [2018,8,7], max: [2019,3,27]})
    endPicker.set({min: [2018,8,7], max: [2019,3,27]})
    
    var infosession = {}

    let todayPost = function () {
        $http.post('/todayssessions', {})
        .then(function(res) {
            var infosessions = res.data
            if (res.data.empty) {
                $scope.noSessionsToday = true;
            } else {
                $scope.sessionsToday = true;
                for (var i = 0; i < infosessions.length; ++i) {
                    var infosession = infosessions[[i]]
                    infosession.time = formatTime(infosession.start_time, infosession.end_time)
                    infosession.website = (infosession.website.slice(0, 4) != 'http' ? 'https://' : '') + infosession.website
                    if (infosession.building.name == 'Venue not assigned') {
                        infosession.location = infosession.building.name
                    } else {
                        infosession.location = infosession.building.name + ', ' + infosession.building.room
                    }
                }
                $scope.sessions = infosessions
            }
            $scope.showToday = true
        })
    }

    let companyPost = function (term, company) {
        $http.post('/companysession', {term: term, company: company})
        .then(function(res) {
            if (res.data.empty) {
                $scope.showInfo = false
                $scope.noResultsMsg = res.data.empty
                $scope.noResults = true
            } else {
                $scope.noResults = false
                infosession = res.data
                $scope.company = infosession.employer
                if (infosession.building.name == 'Venue not assigned') {
                    $scope.location = infosession.building.name
                } else {
                    $scope.location = infosession.building.name + ', ' + infosession.building.room
                }
                $scope.mapLink = infosession.building.map_url
                $scope.description = infosession.description
                $scope.day = infosession.day
                $scope.date = moment(infosession.date).format('LL')
                $scope.time = formatTime(infosession.start_time, infosession.end_time)
                $scope.companySite = (infosession.website.slice(0, 4) != 'http' ? 'https://' : '') + infosession.website
                $scope.moreInfo = infosession.link
                $scope.audience = infosession.audience
                $scope.showToday = false
                $scope.showIntervals = false;
                $scope.showInfo = true
            }
            $('.fa-spinner').hide()
        })
    }

    let intervalPost = function (term, start, end) {
        $http.post('/intervalsessions', {term: term, start: start, end: end})
        .then(function(res) {
            if (res.data.empty) {
                $scope.showInfo = false
                $scope.showIntervals = false;
                $scope.noResultsMsg = res.data.empty
                $scope.noResults = true
            } else {
                var infosessions = res.data
                var infosession;
                for (var i = 0; i < infosessions.length; ++i) {
                    infosession = infosessions[i]
                    infosession.time = formatTime(infosession.start_time, infosession.end_time)
                    infosession.displayDate = moment(infosession.date).format('LL')
                    infosession.website = (infosession.website.slice(0, 4) != 'http' ? 'https://' : '') + infosession.website
                    if (infosession.building.name == 'Venue not assigned') {
                        infosession.location = infosession.building.name
                    } else {
                        infosession.location = infosession.building.name + ', ' + infosession.building.room
                    }
                }
                $scope.intervalSessions = infosessions
                $scope.showToday = false
                $scope.noResults = false
                $scope.showInfo = false
                $scope.showIntervals = true;
            }
            $('.fa-spinner').hide()
        })
    }

    let reminderPost = function (email, session) {
        $http.post('/sendreminder', {email: email, infosession: session ? session : infosession})
    }

    $scope.$watch('$viewContentLoaded', function() {
        $('#terms').css('color', 'grey')
        todayPost()
    });

    $scope.enterSearch = function (e) {
        if (e.which == 13) {
            if ($scope.searchedTerm && $scope.searchedCompany) {
                $('.fa-spinner').show()
                companyPost($scope.searchedTerm, $scope.searchedCompany)
            } else {
                $scope.noResultsMsg = 'Please specify both a term and company'
                $scope.noResults = true
            }
        }
    }
    $scope.companySearch = function () {
        if ($scope.searchedTerm && $scope.searchedCompany) {
            $('.fa-spinner').show()
            companyPost($scope.searchedTerm, $scope.searchedCompany)
        } else {
            $scope.noResultsMsg = 'Please specify both a term and company'
            $scope.noResults = true
        }
    }

    $scope.intervalSearch = function () {
        if ($scope.searchedTerm && $('#intervalStart').val() && $('#intervalEnd').val()) {
            $('.fa-spinner').show()
            intervalPost($scope.searchedTerm, moment($('#intervalStart').val()), moment($('#intervalEnd').val()))
        } else {
            $scope.noResultsMsg = 'Please specify both a term and a date range'
            $scope.noResults = true
        }
    }

    $scope.openVex = function (e) {
        var input = ['<input name="email" type="text" placeholder="Email" required />']
        if (e) {input.push('<input style="display: none;" name="infosession" type="text" value="' + JSON.stringify($(e).data('session')).replace(/"/g, "`") + '" />')}
        vex.dialog.open({
            message: 'You will be sent a reminder the evening before this info session.',
            input: input.join(''),
            buttons: [
                $.extend({}, vex.dialog.buttons.YES, { text: 'Remind me' }),
                $.extend({}, vex.dialog.buttons.NO, { text: 'Back' })
            ],
            callback: function (data) {
                if (data) {
                    if ($('#infoDisplay').is(':visible')) {
                        reminderPost(data.email)
                    } else if ($('#intervalDisplay')) {
                        reminderPost(data.email, JSON.parse(data.infosession.replace(/`/g, '"')))
                    }
                    vex.dialog.alert('A reminder of this info session will be sent to you the evening before.')
                    setTimeout(function () {vex.closeAll()}, 4000)
                }
            }
        })
    }
});
