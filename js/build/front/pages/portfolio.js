;(function($, window) {
    $(document).ready(function() {
        var $sections = $('.content').filter(function(i, el) {
            return !!$(el).find('.kartra_portfolio_item').length;
        });

        resizePortfolioItems($sections);

        $(window).resize(throttle(function() {
            resizePortfolioItems($sections);
        }, 100));

        $sections.each(function(i, el) {
            var $section = $(el);

            el.addEventListener('kartra_show_hidden_asset', function(ev) {
                resizePortfolioItems($section);
            }, false);
        });

        $(document).on('click', '.kartra_portfolio_item__portfolio-link', function() {
            var $link = $(this),
                $portfolioModal = $('#portfolioModal'),
                $portfolioModalBody = $portfolioModal.find('.modal-body'),
                $portfolioModalImage = $portfolioModalBody.find('.img'),
                $portfolioImage = $link.find('.background-item'),
                imageUrl = $portfolioImage.css('background-image');

            $portfolioModalImage.css('background-image', imageUrl);
        });
    });

    function throttle(func, timeFrame) {
        var lastTime = 0;

        return function () {
            var now = new Date();

            if (now - lastTime >= timeFrame) {
                func();
                lastTime = now;
            }
        };
    }

    function resizePortfolioItems($sections) {
        $sections.each(function(i, el) {
            var $section = $(el),
                $portfolioItems = $section.find('.kartra_portfolio_item');

            $portfolioItems.each(function(itemIndex, itemEl) {
                var $item = $(itemEl);

                if ($section.hasClass('js_portfolio7')) {
                    if ($item.hasClass('kartra_portfolio_item--large')) {
                        $item.css('height', 490);
                    } else {
                        $item.css('height', 202);
                    }
                } else {
                    var width = $item.width();

                    $item.css('height', width);
                }
            });
        });
    }
})(jQuery, window);