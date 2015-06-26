var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET home page. */
router.get('/innovasibersatu', function(req, res, next) {
  res.render('basic', { title: 'InnovasiBersatu', 'when' : '6pm-9pm, Friday, 22 May 2015', 
  'where':'Crackerz - Crazy Hackerz International, MD Tower 2, 5th Floor. Jl.Setiabudi Selatan No. 7, Kuningan Jakarta Pusat', 'info':'Ini merupakan sebuah sarana kolaborasi digital untuk berbagi links, pikiran, ide, dll.', 'warning':'Pada akhir acara, harap Anda meng-copy-paste isi dari textpad dan spreadsheet ini ke dalam komputer Anda masing-masing karena isinya tidak akan tersimpan di dalam server (!) Terimakasih untuk perhatiannya.' });
});

module.exports = router;
