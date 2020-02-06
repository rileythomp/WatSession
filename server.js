'use strict'

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var uwaterlooApi = require('uwaterloo-api'); 
var moment = require('moment');
var CronJob = require('cron').CronJob;
var node4mailer = require('node4mailer')
var formatTime = require('./helpers').formatTime
var codeToTermMap = require('./helpers').codeToTermMap
var companiesMatch = require('./helpers').companiesMatch

var uwclient = new uwaterlooApi({
  API_KEY : 'd55d4614484986ea90da927aa3ad33b1 '
});

const port = process.env.PORT || 3000

app.use(express.static(__dirname + '/public'));

app.use(bodyParser.json());

app.post('/todayssessions', function (req, res) {
  uwclient.get('/terms/{term}/infosessions', {
    term: 1201,
    }, 
    function(err, data) {
      var infosessions = data.data
      var todays = []
      for (var i = 0; i < infosessions.length; ++i) {
        var infosession = infosessions[i]
        if (moment().isSame(infosession.date, 'day')) {
          todays.push(infosession)
        }
        if (infosession.employer[0] == '*') {
          infosession.employer = infosession.employer.slice(1)
        }
      }
      if (todays.length) {
        res.send(todays)
      } else {
        res.send({empty: 'There are no info sessions today'})
      }
    })
})

app.post('/companysession', function(req, res) {
  var search = req.body
  uwclient.get('/terms/{term}/infosessions', {
    term : search.term,
    }, 
    function(err, data) {
      var infosessions = data.data
      for (var i = 0; i < infosessions.length; ++i) {
        var infosession = infosessions[i]
        if (infosession.employer[0] == '*') {
          infosession.employer = infosession.employer.slice(1)
        }
        if (companiesMatch(search.company, infosession.employer)) {
          res.send(infosession)
          return
        }
      }
      var empty = `${search.company} has no info sessions in the ${codeToTermMap[search.term]} term`
      res.send({empty: empty})
    })
});

app.post('/intervalsessions', function (req, res) {
  var search = req.body
  uwclient.get('/terms/{term}/infosessions', {
    term: search.term
  },
  function (err, data) {
    var infosessions = data.data
    var sessionsInRange = []
    var searchStart = moment(search.start)
    var searchEnd = moment(search.end)
    for (var i = 0; i < infosessions.length; ++i) {
      var infosession = infosessions[i]
      var sessionDate = moment(infosession.date)
      if (sessionDate <= searchEnd && sessionDate >= searchStart) {
        sessionsInRange.push(infosession)
      }
      if (infosession.employer[0] == '*') {
        infosession.employer = infosession.employer.slice(1)
      }
    }
    if (sessionsInRange.length) {
      res.send(sessionsInRange)
    } else {
      var empty = `There are no info sessions between ${searchStart.format('LL')} and ${searchEnd.format('LL')}`
      res.send({empty: empty})
    }
  })
})

app.post('/sendreminder', function (req, res) {
  var email = req.body.email
  var infosession = req.body.infosession
  let date = moment(infosession.date).subtract(6, 'hours')
  const job = new CronJob(date, function() {
    var transporter = node4mailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'watsession@gmail.com',
        pass: 'w@t5e55ion'
      }
    });
    var mailOptions = {
      from: 'watsession@gmail.com',
      to: email,
      subject: 'Info Session Reminder',
      html: '<p>Company: '+infosession.employer+'<p>\
             <p>Description: '+infosession.description+'<p>\
             <p>Date: <span>'+infosession.day+'</span>,<span> '+moment(infosession.date).format('LL')+'<span><p>\
             <p>Time: '+formatTime(infosession.start_time, infosession.end_time)+'<p>\
             <p>Building: <a href="'+infosession.building.map_url+'">'+infosession.building.name+', '+infosession.building.room+'</a><p>\
             <p><a href="'+(infosession.website.slice(0, 4) != 'http' ? 'https://' : '') + infosession.website+'">Company site</a><p>\
             <p><a href="'+infosession.link+'">More info</a><p>\
             <p>Audience: '+infosession.audience.join(', ')+'<p>'
    };
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  });
  job.start();
})

app.listen(port, function() {
    console.log('Server listening on port', port);
});
