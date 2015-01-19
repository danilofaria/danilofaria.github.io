/* ===================================================
 * template specific javascript funtions
 * ================================================ */


function init_masonry(){
    
    var $container = $('#portfolio');
    var gutter = 12;
    var min_width = 150;

    $container.imagesLoaded( function(){
        
        $container.masonry({

            itemSelector: '.portfolio-item',
            gutterWidth: gutter,
            isAnimated: true,
            columnWidth: function( containerWidth ) {

                var num_of_boxes = (containerWidth/min_width | 0);

                var box_width = (((containerWidth - (num_of_boxes-1)*gutter)/num_of_boxes) | 0) ;

                if (containerWidth < min_width) {
                    box_width = containerWidth;
                }

                $('.portfolio-item').width(box_width);

                return box_width;
            }
        });
    });
}

$('a[href="#portfolio-tab"]').on('shown', function (e){

    init_masonry();

    window.setTimeout(function() {

        $(window).trigger('resize');
    
    }, 1000);

});

/* google maps */
var myLatlng = new google.maps.LatLng(40.8136393,-73.96120250000001);

var mapInitOpts = {
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    center: myLatlng,
    zoom: 12
};

var map = new google.maps.Map(document.getElementById("my-location"), mapInitOpts);

var marker = new google.maps.Marker({
    position: myLatlng, 
    map: map, 
    title: "My Office" 
});


$('a[href="#contact-tab"]').on('shown', function (e){

    center_map();

    google.maps.event.trigger(map, 'resize'); 
    moveTo();

});

$(window).on('resize', function (e){
    
    center_map();

});

function center_map(){
    
    window.setTimeout(function() {
        map.panTo(marker.getPosition()); 
        }, 500);

};
