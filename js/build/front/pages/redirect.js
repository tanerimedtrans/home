;(function() {

    var redirectEl = document.querySelector('meta[data-redirect]'),
        redirectObj,
        redirectUrl,
        newTab = false;

    if (redirectEl) {
        redirectObj = JSON.parse(redirectEl.dataset.redirect);

        redirectObj = booleanify(redirectObj);

        if (!redirectObj.certain) {
            performRedirect();
        } else {
            queryCookies();
        }
    }

    function performRedirect() {
        var pageHash = '';
        var inIframe = isInIframe();
        var location = window.location;
        var searchParams = new URLSearchParams(location.search);
        var urlParams = getUrlParams(location);
        var uuid = window.kuuid;
        var kref = window.kref;

        if (redirectObj.redirectToUrl) {
            if (redirectObj.custom.protocol) {
                redirectUrl = redirectObj.custom.protocol;
            } else {
                redirectUrl = 'http://';
            }

            redirectUrl += redirectObj.custom.url;

            if (redirectObj.custom.newTab) {
                newTab = redirectObj.custom.newTab;
            }

        } else {
            redirectUrl = redirectObj.page.url;

            if (redirectObj.page.newTab) {
                newTab = redirectObj.page.newTab;
            }
        }

        var urlParamsForRedirectUrl = getUrlParams(new URL(redirectUrl));

        redirectUrl += (
            redirectUrl.indexOf('?') === -1
                ? '?'
                : '&'
        ) + 'kuid=' + encodeURIComponent(uuid);

        if (kref) {
            redirectUrl += '&kref=' + encodeURIComponent(kref);
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

        if (inIframe) {
            window.parent.postMessage({
                redirectUrl: redirectUrl,
                newTab: newTab
            }, '*');
        } else {
            if (newTab && 'true' === newTab) {
                window.open(redirectUrl);
            } else {
                window.location = redirectUrl;
            }
        }
    }

    function queryCookies() {
        var lists = {},
            sequences = {},
            tags = {},

            data = {
                days: '0',
                hours: '0',
                seconds: '0',
                minutes: '0'
            };

        var type = redirectObj.option;

        if (type === 'list' || type === 'not-list') {
            lists[redirectObj.list.id] = data;
        } else if (type === 'sequence' || type === 'not-sequence') {
            sequences[redirectObj.sequence.id] = data;
        } else if (type === 'tag' || type === 'not-tag') {
            tags[redirectObj.category_tag.tag] = data;
        }

        var resources = {
            lists: lists,
            tags: tags,
            sequences: sequences
        };

        var xhttp = new XMLHttpRequest();

        xhttp.open("POST", secure_base_url + 'front/email_countdown/ajax_countdown_data', true);

        xhttp.withCredentials = true;

        var formData = new FormData();
        formData.append('pageHashedId', global_id);
        formData.append('resources', JSON.stringify(resources));
        xhttp.send(formData);

        xhttp.onreadystatechange = function() {
            if (xhttp.readyState == 4 && xhttp.status == 200) {
                var data = JSON.parse(xhttp.responseText);

                var result = {};

                if (data.success === true && data.resources) {
                    if (data.resources.based_on_subscribe_list_date) {
                        result.list = data.resources.based_on_subscribe_list_date;
                    }
                    if (data.resources.based_on_subscribe_tag_date) {
                        result.tag = data.resources.based_on_subscribe_tag_date;
                    }
                    if (data.resources.based_on_subscribe_sequence_date) {
                        result.sequence = data.resources.based_on_subscribe_sequence_date;
                    }
                }

                if (type === 'list') {
                    if (result.list && result.list[redirectObj.list.id]) {
                        performRedirect();
                    }
                } else if (type === 'not-list') {
                    
                    if (!result.list || !result.list[redirectObj.list.id]) {
                        performRedirect();
                    }
                } else if (type === 'sequence') {
                    if (result.sequence && result.sequence[redirectObj.sequence.id]) {
                        performRedirect();
                    }
                } else if (type === 'not-sequence') {
                    if (!result.sequence || !result.sequence[redirectObj.sequence.id]) {
                        performRedirect();
                    }
                } else if (type === 'tag') {
                    if (result.tag && result.tag[redirectObj.category_tag.tag]) {
                        performRedirect();
                    }
                } else if (type === 'not-tag') {
                    if (!result.tag || !result.tag[redirectObj.category_tag.tag]) {
                        performRedirect();
                    }
                }
            }
        };


    }

    function booleanify(obj) {
        for (var propName in obj) {
            if (obj[propName] === 'true') {
                obj[propName] = true;
            } else if (obj[propName] === 'false') {
                obj[propName] = false;
            }
        }

        return obj;
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

    function isInIframe() {
        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
    }
})();