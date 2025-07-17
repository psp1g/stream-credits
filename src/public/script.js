$(document).ready(function() {
    scrollAnimation();
});

let animationStopped = false;
let logoTimeoutId, scrollTimeoutId;

function scrollAnimation() {
    const height = $('#scrolling').height() - 1400 ;
    const pixelsPerSecond = 10000; // Adjust this value to control speed
    const time = (height + 300) / pixelsPerSecond * 1000; // Convert to milliseconds

    console.log("Starting animation, height:", height, "time:", time);

    logoTimeoutId = setTimeout(() => {
        if (animationStopped) return;
       console.log("Logo animation starting");
        $('#psplogo').css({ display: 'block' });
    }, 2000);

    scrollTimeoutId = setTimeout(() => {
        if (animationStopped) return;
        console.log("Scroll animation starting");
        
        $('#scrolling')
            .css({ top: '125%', display: 'block' })
            .animate({ top: `-${height + 300}px` }, { 
                duration: time, 
                queue: false, 
                easing: "linear" 
            });
        
         $('#logocontainer')
            .animate({ 'opacity': 0 }, { 
                duration: 4000, 
                queue: false, 
                easing: "linear" 
            });
        
        setTimeout(() => {
            $('#psplogo')
                .animate({ 'opacity': '0' }, { 
                    duration: 4000, 
                    queue: false, 
                    easing: "linear" 
                });
        }, 2000);

        // Fade out background after 2m 23s
        setTimeout(() => {
            if (animationStopped) return;
            $('#background')
                .animate({ 'opacity': '0' }, { 
                    duration: 1000, 
                    queue: false, 
                    easing: "linear" 
                });
        }, 143000); // 2 minutes 23 seconds

    }, 100);
}

// Stop scrolling animation on actual user scroll
function stopScrollAnimation() {
    if (animationStopped) return;
    animationStopped = true;
    clearTimeout(logoTimeoutId);
    clearTimeout(scrollTimeoutId);
    $('#scrolling').stop(true, false); // Stop the animation
    $('#scrolling').css('top', $(window).scrollTop()); // Optionally sync position
    // Optionally, fade out logo immediately
    $('#logocontainer').stop(true, false).css('opacity', 0);
    $('#psplogo').stop(true, false).css('opacity', 0);
}

// Listen for mouse wheel, touch, or manual scroll
$(window).on('wheel touchmove scroll', stopScrollAnimation);

// Always start at the top on reload
// window.onbeforeunload = function () {
//     window.scrollTo(0, 0);
// };


