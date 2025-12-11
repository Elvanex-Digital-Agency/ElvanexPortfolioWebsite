(function ($) {
    "use strict";

    // Spinner
    var spinner = function () {
        setTimeout(function () {
            if ($('#spinner').length > 0) {
                $('#spinner').removeClass('show');
            }
        }, 1);
    };
    spinner();
    
    // Initiate WOW.js
    new WOW().init();

    // Sticky Navbar
    $(window).scroll(function () {
        if ($(this).scrollTop() > 45) {
            $('.navbar').addClass('sticky-top shadow-sm');
        } else {
            $('.navbar').removeClass('sticky-top shadow-sm');
        }
    });

    // Back to top button
    $(window).scroll(function () {
        if ($(this).scrollTop() > 100) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({scrollTop: 0}, 1500, 'easeInOutExpo');
        return false;
    });

    // Testimonials carousel
    $(".testimonial-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1000,
        center: true,
        dots: false,
        loop: true,
        nav: true,
        navText: [
            '<i class="bi bi-chevron-left"></i>',
            '<i class="bi bi-chevron-right"></i>'
        ],
        responsive: {
            0: { items: 1 },
            576: { items: 1 },
            768: { items: 2 },
            992: { items: 3 }
        }
    });

    // Client carousel
    $(".client-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1000,
        margin: 90,
        dots: false,
        loop: true,
        nav: false,
        responsive: {
            0: { items: 2 },
            576: { items: 3 },
            768: { items: 4 },
            992: { items: 5 },
            1200: { items: 6 }
        }
    });

    // Active Navigation Link Based on Current Page
    $(document).ready(function() {
        var path = window.location.pathname; // e.g. "/blog/blog.html" or "/index.html"
        
        // Remove leading slash
        if (path.startsWith("/")) path = path.slice(1);
        
        // Remove trailing slash and ".html"
        path = path.replace(/\/$/, "").replace(".html", "");
    
        $(".navbar-nav a").each(function () {
            var linkHref = $(this).attr("href").replace(/^\//, "").replace(/\/$/, "").replace(".html", "");
            
            // Home page
            if ((path === "" || path === "index") && linkHref === "index") {
                $(this).addClass("active");
            }
            // Blog pages
            else if (path.startsWith("blog") && linkHref.startsWith("blog")) {
                $(this).addClass("active");
            }
            // Other pages
            else if (path === linkHref) {
                $(this).addClass("active");
            }
        });
    });
    
})(jQuery);
