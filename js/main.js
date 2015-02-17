var INSPIREDOWN = (function () {
	var id;
	var targetDate = new Date((new Date()).getTime()+3888000000);
	var backgroundUrl = "/img/default-bg.jpg";
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
				initIcons();
				initDimensions();
				initCountdown();
			});
		}
		else {
			initBackground();
			initIcons();
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

	function paintIcon(img, ctx, size) {
		if (img.width > 512 && img.height > 512) {
			ctx.drawImage(img, img.width/2-256, img.height/2-256, 512, 512, 0, 0, size, size);
		}
		else {
			ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, size, size);
		}

		var diff = getDateDifference();
		var fontSize = Math.floor((size / (diff.days+'').length) * 1.25);

		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.font = "bold "+fontSize+"px/"+fontSize+"px Helvetica,Arial,sans-serif";
		ctx.fillStyle = "white";
		ctx.strokeStyle = "black";
		ctx.lineWidth = 1;
		ctx.fillText(diff.days, size/2, size/2);
		ctx.strokeText(diff.days, size/2, size/2);
	}

	function createIcon(img, rel, size) {
		var canvas = $('<canvas width="'+size+'" height="'+size+'"></canvas>')[0];
		var ctx = canvas.getContext('2d');

		paintIcon(img, ctx, size);

		$('head').append($('<link rel="'+rel+'" type="image/png" sizes="'+size+'x'+size+'" href="' + canvas.toDataURL('image/png') + '" />'));
		//$('.page-content').append(canvas);
	}

	function appendDefaultIcons() {
		$('head').append($('<link rel="icon" type="image/png" href="/img/favicon.png" />'));
		$('head').append($('<link rel="apple-touch-icon" href="/img/touch-icon-iphone.png">'));
    	$('head').append($('<link rel="apple-touch-icon" sizes="76x76" href="/img/touch-icon-ipad.png">'));
    	$('head').append($('<link rel="apple-touch-icon" sizes="120x120" href="/img/touch-icon-iphone-retina.png">'));
    	$('head').append($('<link rel="apple-touch-icon" sizes="152x152" href="/img/touch-icon-ipad-retina.png">)'));
	}

	function initIcons(src) {
		if (!src) src = backgroundUrl;

		var img = new Image();
		img.crossOrigin = "anonymous";

		img.onload = function() {
			createIcon(img, "apple-touch-icon-precomposed", 60);
			createIcon(img, "icon", 64);
			createIcon(img, "apple-touch-icon-precomposed", 76);
			createIcon(img, "apple-touch-icon-precomposed", 120);
			createIcon(img, "apple-touch-icon-precomposed", 152);
		}
		img.onerror = function(err) {
			if (img.src == "/img/default-bg.jpg") {
				console.log("Giving up, using default icons");
				appendDefaultIcons();
			}
			else {
				console.log("CORS error, using default background");
				initIcons("/img/default-bg.jpg");
			}
		}

		img.src = src;
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
		var currentId = window.location.hash.replace(/^#/,'');

		if (currentId && id != currentId) {
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
