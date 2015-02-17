var INSPIREDOWN = (function () {
	var id;
	var targetDate = new Date((new Date()).getTime()+3888000000);
	var backgroundUrl = "https://upload.wikimedia.org/wikipedia/commons/8/86/Man_o%27war_cove_near_lulworth_dorset_arp.jpg";
	var firebase = new Firebase('https://inspiredown.firebaseio.com/');
	var exports = {};
	var timers = [];

	function initData() {
		if (window.location.hash) {
			id = window.location.hash.replace(/^#/,'');
			$('header').css('display','none');
			$('footer').css('display','none');
			firebase.child('submissions').child(id).once('value', function(snap) {
				var val = snap.val();
				targetDate = new Date(val.datetime);
				backgroundUrl = val.url;

				initBackground();
				initDimensions();
				initCountdown();
			});
		}
		else {
			initBackground();
			initDimensions();
			initCountdown();
		}
	}

	function initDimensions() {
		var isFull = $('header').css('display')=='none' && $('footer').css('display')=='none';
		var windowWidth = $(window).width();
		var windowHeight = $(window).height();
		var headerHeight = isFull ? 0 : $('header').height();
		var footerHeight = isFull ? 0 : $('footer').height();
		var margin = isFull ? 0 : 64;
		var stageHeight = windowHeight - headerHeight - footerHeight;

		var fontSize = Math.max(Math.floor(windowWidth/30), Math.floor(stageHeight/18));
		var padding = (stageHeight - fontSize * 1.5) / 2 - margin;

		$('#main')
			.css('padding-top', padding+'px')
			.css('padding-bottom', padding+'px')
			.css('font-size', fontSize+'px');
	}

	function initBackground() {
		$('#main').css('background-image', 'url('+backgroundUrl+')');
	}

	function getDateDifference() {
		var ms = targetDate.getTime() - (new Date()).getTime();
		var days = Math.floor(ms/86400000);
		ms = ms % 86400000;
		var hours = Math.floor(ms/3600000);
		ms = ms % 3600000;
		var minutes = Math.floor(ms/60000);
		ms = ms % 60000;
		var seconds = Math.floor(ms/1000);
		ms = ms % 1000;
		var ds = Math.floor(ms/100);

		return {
			'days': days,
			'hours': hours,
			'minutes': minutes,
			'seconds': seconds,
			'ms': ms,
			'ds': ds
		};
	}

	function getCountdownString() {
		var diff = getDateDifference();
		var windowWidth = $(window).width();
		var fontSize = parseInt($('#main').css('font-size').replace("px","")) / 2; // Not fixed width, so approx

		var result = diff.days + " days, " + diff.hours + " hours, " + diff.minutes + 
			" minutes, " + diff.seconds + "." + diff.ds + " seconds";

		if (result.length * fontSize + 50 > windowWidth) {
			result = diff.days + " days, " + diff.hours + " hours, " + diff.minutes + 
				" minutes, " + diff.seconds + " seconds";
		}

		if (result.length * fontSize + 50 > windowWidth) {
			result = diff.days + "d " + diff.hours + "h " + diff.minutes + "m " + diff.seconds + "s";
		}

		if (result.length * fontSize + 50 > windowWidth) {
			result = diff.days + "d " + diff.hours + ":" + diff.minutes;
		}

		return result;
	}

	function resetTimers() {
		for (var i=0; i<timers.length; i++) {
			window.clearInterval(timers[i]);
		}
		timers = [];
	}

	function initCountdown() {
		resetTimers();
		timers.push(window.setInterval(paintCountdown, 100));
		timers.push(window.setInterval(checkHash, 1000));
	}

	function paintCountdown() {
		$('#main').text(getCountdownString());
	}

	function checkHash() {
		if (/potatono\.github\.io\/inspiredown/.test(window.location.href)) {
			window.location.href = "http://www.inspiredown.com" + window.location.hash;
		}

		var currentId = window.location.hash.replace(/^#/,'');

		if (id != currentId) {
			initData();
		}
	}

	function validateDate() {
		var date = $('#date').val();
		var d = Date.parse(date);

		if (isNaN(d)) { 
			date.replace(/\-/g,'/'); 
			d = Date.parse(date);
		}

		$('#date_error').toggleClass("hide",!isNaN(d));
	}

	function validateTime() {
		var time = $('#time').val();

		var d = Date.parse('5/18/2014 ' + time);

		$('#time_error').toggleClass("hide",!isNaN(d));
	}

	function validateUrl() {
		var url = $('#url').val();
		var image = new Image();
		var timer;

		image.onload = function() { 
			window.clearTimeout(timer);
			$('#url_loading').addClass("hide");
			$('#url_error').addClass('hide');
		
		}
		image.onerror = function() {
			window.clearTimeout(timer);
			$('#url_loading').addClass("hide");
			$('#url_error').removeClass('hide');
		}

		image.src = url;

		$('#url_error').addClass("hide");
		$('#url_loading').removeClass("hide");

		timer = window.setTimeout(function() {
			$('#url_loading').addClass("hide");
			$('#url_error').removeClass("hide");
		}, 10000);
	}

	function submitCreate(event) {
		event.preventDefault();

		if ($('#url_error').hasClass("hide") && 
			$('#url_loading').hasClass("hide") &&
			$('#date_error').hasClass("hide") &&
			$('#time_error').hasClass("hide")) 
		{

			var dts = $('#date').val().replace(/\-/g,'/') + " " + $('#time').val();
			var datetime = Date.parse(dts);			
			var url = $('#url').val();
			var result;

			result = firebase.child('submissions').push({ 'datetime': datetime, 'url': url }, 
				function() {
					var url = window.location.href.replace(/\/create\/?\??/,"/#" + result.key());
					$('#success a').text(url).attr('href',url);
					$('#success').removeClass("hide");
					
				}
			);	
		}
	}

	function initCreate() {
		$('#create').submit(submitCreate);
		$('#url').blur(validateUrl);
		$('#date').blur(validateDate);
		$('#time').blur(validateTime);

		var p = function(v) { return v<10 ? '0'+v : v; }
		var d = new Date((new Date().getTime()) + 3888000000);

		$('#date').val(d.getFullYear() + "-" + p(d.getMonth()+1) + "-" + p(d.getDate()));
		$('#time').val('12:30:00');
		$('#url').val(backgroundUrl);

	}

	function init() {
		if ($('#main').length) {
			initData();
		}
		else if ($('#create').length) {
			initCreate();
		}
	}

	$(window).load(init);
	$(window).resize(initDimensions);

	return exports;
}());
