angular.module( "phoneNumberFormatter" )
    .factory( "PhoneNumberFormatter", PhoneNumberFormatter );

/* ngInject */
function PhoneNumberFormatter( $q, $window, $timeout, lodash, countryCodeData, googUtils ) {
    return function( args ) {
        var utils;

        angular.extend( this, {
            getFormattedNumber: getFormattedNumber,
            isInternational: isInternational,
            trim: trim
        } );

        initialize();

        function initialize( item ) {
            // Allow overwriting of exposed data - including functions - if desired
            if ( angular.isDefined( args ) ) {
                angular.extend( this, args );
            }
        }

        /**
         * Gets the dial code from the number
         * @param  {str} number The number given
         * @return {object}        An object including the dialcode and country and whether it was or was not a match
         */
        function getIso2( number ) {
            var numericChars = "",
                resp = {
                    hasMatch: false
                };

            // If the number begins with "+" (and thus is international), run through each of the numbers to see if it corresponds to a country code
            for ( var i = 1; i < number.length; i++ ) {
                var c = number.charAt( i );

                if ( !lodash.isNaN( parseFloat( c ) ) && isFinite( c ) ) {
                    numericChars += c;

                    // Does the number thus far correspond to an iso string?
                    if ( countryCodeData[ numericChars ] ) {
                        angular.extend( resp, {
                            iso2: countryCodeData[ numericChars ],
                            hasMatch: true
                        } );
                    }

                    // There are a max of 4 numbers in a country code, so break out of the loop if it reaches this
                    if ( numericChars.length === 4 ) {
                        break;
                    }
                }
            }

            return resp;
        }

        /**
         * Formats the number as if it's international
         * @param  {str} number Phone Number
         * @return {str}        Formatted Phone Number
         */
        function formatInternationalNumber( number ) {
            var trimmed = trim( number ),
                iso2 = getIso2( trimmed );

            // If the number begins with a valid country code in iso2 format
            if ( iso2.hasMatch ) {
                var countryCode = iso2.iso2[ 0 ];

                return countryCode ? googUtils.formatNumber( trimmed, countryCode ) : formatNationalNumber( trimmed );
            } else {
                // do not format
                return number;
            }
        }

        /**
         * Formats the number as if it's national
         * @param  {str} number Phone Number
         * @return {str}        Formatted Phone Number
         */
        function formatNationalNumber( number ) {
            var trimmed = trim( number ),
                // "short" and "long" are used to make sure there is no trailing dash if the number is less than 6 digits
                // TODO: See if there is a way to do this using pure regex
                phoneRegex = {
                    short: /^\(?([0-9]{3})\)?[-]?([0-9]{0,3})$/,
                    long: /^\(?([0-9]{3})\)?[-]?([0-9]{0,3})[-]?([0-9]{0,4})$/
                },
                regexReplacement = {
                    short: "($1) $2",
                    long: "($1) $2-$3"
                };

            // Only parsing numbers that are greater than 2 and less than or equal to 10 for my sanity.  Also, not returning trimmed version of numbers greater that 14 (max parsed value) to allow for extension codes
            if ( !lodash.isEmpty( trimmed ) && trimmed.length > 2 ) {
                // If the number is more than the usual number of digits for national numbers, format the first 14 numbers and append the rest to the end.
                var remainingNumbers = trimmed > 10 ? " " + number.slice( 10, number.length + 1 ) : "",
                    replacementType = trimmed.length < 7 ? "short" : "long";

                trimmed = trimmed > 10 ? trimmed.slice( 0, 10 ) : trimmed;

                return trimmed.replace( phoneRegex[ replacementType ], regexReplacement[ replacementType ] ) + remainingNumbers;

            } else {
                // This means it'll return unformatted if there are extension codes
                return number;
            }
        }

        /**
         * Runs the number through the appropriate functions to return the correctly formatted number
         * @param  {str/int} number The number to process
         * @return {str/int}        Formatted number
         */
        function getFormattedNumber( number ) {
            // can't format things that aren't numbers or strings
            if ( !angular.isString( number ) && !angular.isNumber( number ) ) {
                return number;
            }

            // Changes integer to string for correct parsing
            number = "" + number;

            return isInternational( number ) ? formatInternationalNumber( number ) : formatNationalNumber( number );
        }

        /**
         * Trim digits, spaces etc out of number
         * @param  {int/string} number The number to use
         * @return {str}        the trimmed number
         */
        function trim( number ) {
            var trim = !lodash.isEmpty( number ) ? number.replace( /[^\d]/g, '' ) : "";

            return isInternational( number ) ? "+" + trim : trim;
        }

        /**
         * Is the number international, as defined by a plus at the beginning of the number
         * @param  {int/str}  number The number to test
         * @return {Boolean}        Is it international?
         */
        function isInternational( number ) {
            return !lodash.isEmpty( number ) ? number.charAt( 0 ) === "+" : false;
        }

    }
}
