(function(jQuery) {
	window['kartra'] = 'undefined' === typeof window['kartra'] ? [] : window['kartra'];
	window['kartra']['pages'] = 'undefined' === typeof window['kartra']['pages'] ? [] : window['kartra']['pages'];
	window['kartra']['pages']['init'] = 'undefined' === typeof window['kartra']['pages']['init'] ? [] : window['kartra']['pages']['init'];

    var inFrame  = false,
        uniqueId = 0,
        dates    = {
            tag               : {},
            list              : {},
            sequence          : {},
            'tag-dynamic'     : {},
            'list-dynamic'    : {},
            'sequence-dynamic': {},
        };

	jQuery(function(){
		//check if this code is loaded inside an iframe outside of the Kartra ecosystem
		if ( window.self !== window.top) {
			initCountdowns();
			inFrame = true;
		}

		//only execute outside of the Pages UI
		try {
			if ( typeof window.parent.pages === 'undefined' ) {
				initCountdowns();
			}
		} catch (e) { }
	});

	function initCountdowns () {
		var countdowns,
			x;

		countdowns = document.querySelectorAll('*[data-countdown]');

        var lists             = {},
            sequences         = {},
            tags              = {},
            lists_dynamic     = {},
            sequences_dynamic = {},
            tags_dynamic      = {};

		for ( x = 0; x < countdowns.length; x++ ) {

			if ( !countdowns[x].hasAttribute('data-countdown-id') ) break;
			else {
				var type = countdowns[x].getAttribute('data-countdown');
				if (type.indexOf('dynamic') !== -1) {
					// this is for dynamic countdowns, in specific DD:HH:MM:SS
					var data = {
						days: countdowns[x].getAttribute('data-days'),
						hours: countdowns[x].getAttribute('data-hours'),
						seconds: countdowns[x].getAttribute('data-seconds'),
						minutes: countdowns[x].getAttribute('data-minutes'),
					}
				} else {
					// this is for normal countdowns, based on EST time or static
					var data = {
						offsetDays: countdowns[x].getAttribute('data-days'),
						time: countdowns[x].getAttribute('data-time'),
					};
				}

				if (type === 'list') {
					if (jQuery.isNumeric(countdowns[x].getAttribute('data-list-id'))) {
						lists[countdowns[x].getAttribute('data-list-id')] = data;
					}
				} else if (type === 'sequence') {
					if (jQuery.isNumeric(countdowns[x].getAttribute('data-sequence-id'))) {
						sequences[countdowns[x].getAttribute('data-sequence-id')] = data;
					}
				} else if (type === 'tag') {
					if (jQuery.isNumeric(countdowns[x].getAttribute('data-tag-id'))) {
						tags[countdowns[x].getAttribute('data-tag-id')] = data;
					}
				} else if (type === 'list-dynamic') {
					if (jQuery.isNumeric(countdowns[x].getAttribute('data-list-id'))) {
						lists_dynamic[countdowns[x].getAttribute('data-list-id')] = data;
					}
				} else if (type === 'sequence-dynamic') {
					if (jQuery.isNumeric(countdowns[x].getAttribute('data-sequence-id'))) {
						sequences_dynamic[countdowns[x].getAttribute('data-sequence-id')] = data;
					}
				} else if (type === 'tag-dynamic') {
					if (jQuery.isNumeric(countdowns[x].getAttribute('data-tag-id'))) {
						tags_dynamic[countdowns[x].getAttribute('data-tag-id')] = data;
					}
				}
			}
		}

		var resources = {
			lists: lists,
			tags: tags,
			sequences: sequences,
			lists_dynamic: lists_dynamic,
			tags_dynamic: tags_dynamic,
			sequences_dynamic: sequences_dynamic,
		};

	    var performSetup = function() {
	    	for ( x = 0; x < countdowns.length; x++ ) {
				if ( !countdowns[x].hasAttribute('data-countdown-id')) {
					break;	
				} else if (jQuery(countdowns[x]).parents('[data-delay-duration]').not('.js_delay_loaded').length > 0) {
					// works with delay code in pages-skeleton.js
					jQuery(countdowns[x])
						.attr('data-delayed-type', 'countdown')
						.addClass('js_delayed');

					continue;
				}

				setupCountdown(jQuery(countdowns[x]));
			}
	    };

        if (Object.keys(lists).length === 0 &&
            Object.keys(tags).length === 0 &&
            Object.keys(sequences).length === 0 &&
            Object.keys(lists_dynamic).length === 0 &&
            Object.keys(tags_dynamic).length === 0 &&
            Object.keys(sequences_dynamic).length === 0)
        {
            performSetup();
        } else {
            jQuery.ajax({
                type: 'post',
                url: secure_base_url+'front/email_countdown/ajax_countdown_data',
                xhrFields: {
                    withCredentials: true
                },
                data: {pageHashedId: global_id, resources: resources},
            }).done(function (data) {
                if (data.success === true) {
                    if (data.resources.based_on_subscribe_list_date) {
                        dates.list = data.resources.based_on_subscribe_list_date;
                    }
                    if (data.resources.based_on_subscribe_tag_date) {
                        dates.tag = data.resources.based_on_subscribe_tag_date;
                    }
                    if (data.resources.based_on_subscribe_sequence_date) {
                        dates.sequence = data.resources.based_on_subscribe_sequence_date;
                    }

                    if (data.resources.based_on_subscribe_list_dynamic) {
                        dates['list-dynamic'] = data.resources.based_on_subscribe_list_dynamic;
                    }
                    if (data.resources.based_on_subscribe_tag_dynamic) {
                        dates['tag-dynamic'] = data.resources.based_on_subscribe_tag_dynamic;
                    }
                    if (data.resources.based_on_subscribe_sequence_dynamic) {
                        dates['sequence-dynamic'] = data.resources.based_on_subscribe_sequence_dynamic;
                    }
                }

                performSetup();
            });
        }
	}

	function setupCountdown($countdown) {
        var countdown      = $countdown[0],
            countdownChild = $countdown.find('div').first(),
            ID             = countdown.getAttribute('data-countdown-id'),
            newDate,
            firstVisitStamp,
            extraForDays,
            extraForHours,
            extraForMinutes,
            extraForSeconds,
            redirectUrl;

		//countdown's kid needs a unique ID
        if (!countdownChild.attr('id')) {
            countdownChild.attr('id', generateUniqueId())
        }

		//redirect after countdown?
		redirectUrl = (countdown.hasAttribute('data-redirect'))? countdown.getAttribute('data-redirect'): false;

		//fixed dates
		if ( countdown.hasAttribute('data-countdown') && countdown.getAttribute('data-countdown') === 'fixed' ) {

			var days,
				month,
				year,
				hours,
				minutes,
				seconds;

			var timestamp = countdown.getAttribute('data-timestamp') || countdown.getAttribute('data-date'),
                newDate = new Date((Number(timestamp)*1000));

	        countDown(newDate, $countdown, redirectUrl);

		} else if ( countdown.hasAttribute('data-countdown') && (countdown.getAttribute('data-countdown') === 'landing' || countdown.getAttribute('data-countdown') === 'landing-dynamic')) {

			//has the user visited the page before?
			if( localStorage.getItem('countdown-' + ID ) !== null ) {

				firstVisitStamp = Number(localStorage.getItem('countdown-' + ID ));

			} else {

				//now is first visit
				firstVisitStamp = Date.now()/1000;

				//store first visit date
				localStorage.setItem('countdown-' + ID, Math.ceil(firstVisitStamp));

			}

			if (countdown.getAttribute('data-countdown') === 'landing' && countdown.getAttribute('data-time')) {
				var timePlusOffset = Number(firstVisitStamp)*1000;
		        timePlusOffset += 86400000 * Number(countdown.getAttribute('data-days'));

		        var newDate = new Date(timePlusOffset),
					time = countdown.getAttribute('data-time').split(':');

                var localTime = new Date(),
                    timezoneOffset = localTime.getTimezoneOffset(),
                    hoursOffset = Math.floor(timezoneOffset / 60),
                    minutesOffset = Math.abs(timezoneOffset % 60);

		        newDate.setHours(Number(time[0]) - hoursOffset);
		        newDate.setMinutes(Number(time[1]) - minutesOffset);
		        newDate.setSeconds(0);
		    } else {

				//process in the additional days, 86400 in one day
				if ( countdown.hasAttribute('data-days') ) {

					extraForDays = 86400 * Number(countdown.getAttribute('data-days'));

					firstVisitStamp += extraForDays;

				}

				//process in the additional hours, 36000 in one hour
				if ( countdown.hasAttribute('data-hours') ) {

					extraForHours = 3600 * Number(countdown.getAttribute('data-hours'));

					firstVisitStamp += extraForHours;

				}

				//process in the additional minute, 60 in one minute
				if ( countdown.hasAttribute('data-minutes') ) {

					extraForMinutes = 60 * Number(countdown.getAttribute('data-minutes'));

					firstVisitStamp += extraForMinutes;

				}

				//process in the additional second
				if ( countdown.hasAttribute('data-seconds') ) {

					extraForSeconds = Number(countdown.getAttribute('data-seconds'));

					firstVisitStamp += extraForSeconds;

				}

				newDate = new Date(firstVisitStamp*1000);
		    }

	        countDown(newDate, $countdown, redirectUrl);

		} else if (countdown.hasAttribute('data-countdown') && (countdown.getAttribute('data-countdown') === 'tag' || countdown.getAttribute('data-countdown') === 'tag-dynamic')) {

			var tag = countdown.getAttribute('data-tag-id');
			if (typeof dates[countdown.getAttribute('data-countdown')][tag] !== 'undefined' && tag !== 'undefined') {
				var time = dates[countdown.getAttribute('data-countdown')][tag]*1000,
					newDate = new Date(time);

				countDown(newDate, $countdown, redirectUrl);
			} else {
				countDown(new Date (Date.now()), $countdown, redirectUrl);
			}

		} else if (countdown.hasAttribute('data-countdown') && (countdown.getAttribute('data-countdown') === 'list' || countdown.getAttribute('data-countdown') === 'list-dynamic')) {

			var list = countdown.getAttribute('data-list-id'); // undefined
			if (typeof dates[countdown.getAttribute('data-countdown')][list] !== 'undefined' && list !== 'undefined') {
				var time = dates[countdown.getAttribute('data-countdown')][list]*1000,
					newDate = new Date(time);

				countDown(newDate, $countdown, redirectUrl);
			} else {
				countDown(new Date (Date.now()), $countdown, redirectUrl);
			}

		} else if (countdown.hasAttribute('data-countdown') && (countdown.getAttribute('data-countdown') === 'sequence' || countdown.getAttribute('data-countdown') === 'sequence-dynamic')) {

			var sequence = countdown.getAttribute('data-sequence-id');
			if (typeof dates[countdown.getAttribute('data-countdown')][sequence] !== 'undefined' && sequence !== 'undefined') {
				var time = dates[countdown.getAttribute('data-countdown')][sequence]*1000,
					newDate = new Date(time);

				countDown(newDate, $countdown, redirectUrl);
			} else {
				countDown(new Date (Date.now()), $countdown, redirectUrl);
			}

		}

	}

	function countDown(newDate, $countdown, redirectUrl) {
		days = newDate.getDate();
		month = newDate.getMonth()+1;
		year = newDate.getFullYear();
		hours = newDate.getHours();
		minutes = newDate.getMinutes();
		seconds = newDate.getSeconds();

		//set the countdown
		if (jQuery().countDown ) {
			$countdown.find('div').first().countDown({
	            targetDate: {
	                'day': days,
	                'month': month,
	                'year': year,
	                'hour': hours,
	                'min': minutes,
	                'sec': seconds
	            },
	            omitWeeks: true,
	            onComplete: function () {
	            	if (redirectUrl) {
                        triggerRedirect(redirectUrl);
	            	}
	            }
	        });

		}
	}

    function triggerRedirect(redirectUrl) {
        var pageHash = '';
        var kartraPage = getKartraPage();
        var location = window.location;
        var urlParams = getUrlParams(location);
        var urlParamsForRedirectUrl = getUrlParams(new URL(redirectUrl));
        var uuid = window.kuuid;
        var kref = window.kref;

        if (kartraPage) {
            pageHash = kartraPage;
        } else {
            if (kref) {
                pageHash = kref;
            }
        }

        redirectUrl += (
            redirectUrl.indexOf('?') === -1
                ? '?'
                : '&'
        ) + 'kuid=' + encodeURIComponent(uuid);

        if (kartraPage !== '') {
            redirectUrl += '&kref=' + encodeURIComponent(pageHash);
        }

        if (urlParams.length) {
            for (var param of urlParams) {
                var existingParam = urlParamsForRedirectUrl.some(function (urlParam) {
                    return urlParam.key === param.key;
                });

                if (!existingParam) {
                    redirectUrl += '&' + param.key + '=' + encodeURIComponent(param.value);
                }
            }
        }

        if (inFrame) {
            top.window.location.href = redirectUrl;
        } else {
            window.location = redirectUrl;
        }
    }

	function generateUniqueId() {
        return 'k-uniq-' + (++uniqueId);
    }

    function getUrlParams(url) {
        var validUrlParams = [
            'utm_source',
            'utm_medium',
            'utm_campaign',
            'utm_content',
            'utm_term',
        ];

        var urlParams = [];

        if (url.search) {
            var searchParams = new URLSearchParams(url.search);

            searchParams.forEach(function (value, key) {
                key = key.toLowerCase();
                value = value.trim();

                if (validUrlParams.indexOf(key) !== -1) {
                    urlParams.push({
                        key: key,
                        value: value
                    });
                }
            });
        }

        return urlParams;
    }

    function getKartraPage() {
        var $pageTrackingElement = jQuery('.js_kartra_trackable_object[data-kt-type="kartra_page_tracking"]');
        var pageHash = '';

        if ($pageTrackingElement) {
            pageHash = $pageTrackingElement.attr('data-kt-value');
        }

        return pageHash || false;
    }

	window['kartra']['pages']['init']['countdown'] = setupCountdown;
})(jQuery);