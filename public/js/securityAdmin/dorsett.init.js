
$(function () {
    //Set up global ajax handling for the app
    $.ajaxSetup({
        cache: false,
        converters: {
            'text json': $.parseJSON
        }
    });

    $(document)
        .ajaxStart(
        function() {
            $.mobile.loading( 'show', { theme: 'b', text: "Working...", textVisible: true } );
        }
    )
        .ajaxStop(
        function() {
            $.mobile.loading( 'hide' );
        }
    )
        .ajaxSend(
        function(event, xhr, settings) {
            //console.log('Sending', $.active, settings.url);
        }
    )
        .ajaxComplete(
        function(event, xhr, settings) {
            //console.log('Complete', $.active, settings.url);
        }
    )
        .ajaxError(
        function (event, jqXHR, settings, error) {
            var response = {},
                message = error || '';
            if (typeof jqXHR.responseText != 'undefined') {
                try {
                    response = $.parseJSON(jqXHR.responseText);
                } catch(e) {}
            }
            if (jqXHR.status == 401) {
                if (dorsett.suppresswarnings) return;
                dorsett.suppresswarnings = true;
                alert('Your session has expired.');
                setTimeout(function(){location = dorsett.webendpoint}, 100);
            } else {
                if (response != null && typeof response.error != 'undefined' && response.error) {
                    message = response.message;
                }
                alert('An error has occurred. We apologize for the inconvenience. Please contact the system administrator for details.' + '\n\n' + message );
            }
        }
    );

    //before we run the app, we have to get session info...
    dorsett.initialize($(window));
});