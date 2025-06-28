$(document).ready(function() {
    scrollAnimation();
});

function scrollAnimation() {
    const height = $('#scrolling').height();
    const pixelsPerSecond = 70; // Adjust this value to control speed
    const time = (height + 300) / pixelsPerSecond * 1000; // Convert to milliseconds

    console.log("Starting animation, height:", height, "time:", time);

    setTimeout(() => {
        console.log("Logo animation starting");
        $('#psplogo').css({ display: 'block' });
    }, 2000);

    setTimeout(() => {
        console.log("Scroll animation starting");
        
        $('#scrolling')
            .css({ top: '125%', display: 'block' })
            // .animate({ top: `-${height + 300}px` }, { 
            //     duration: time, 
            //     queue: false, 
            //     easing: "linear" 
            // });
        
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

    }, 5000);
}


