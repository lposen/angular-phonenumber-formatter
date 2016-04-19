angular.module( "phoneNumberFormatter" )
    .filter( "phoneNumber", phoneNumberFilter );

/* ngInject */
function phoneNumberFilter( PhoneNumberFormatter ) {
    var formatter = new PhoneNumberFormatter();

    return function( input ) {
        return formatter.getFormattedNumber( input );
    }
}
