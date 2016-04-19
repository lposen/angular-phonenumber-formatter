angular.module( "phoneNumberFormatter" )
    .directive( "phoneNumber", phoneNumberDirective );

/* ngInject */
function phoneNumberDirective( $interval, PhoneNumberFormatter, $q, lodash, $timeout, $document ) {
    return {
        scope: false,
        require: "ngModel",
        link: link
    };

    function link( scope, element, attrs, ngModel ) {
        var prevValue,
            prevCaretPos,
            cursorMoves,
            lastUpdated = Date.now(),
            isInput = element[ 0 ].tagName === "INPUT",
            phoneNumber = new PhoneNumberFormatter();

        initialize();

        function initialize() {
            setModelFormatters();

            if ( isInput ) {
                setModelParsers();

                // Done this way to make sure that prevValue is set on first load (otherwise carat stuff gets weird).  Many other (probably more concise) ways to do this, too.
                var initialWatch = scope.$watch( attrs.ngModel, function( newValue ) {
                    return scope.$$postDigest( function() {
                        prevValue = phoneNumber.getFormattedNumber( newValue );

                        // Unbind watch function
                        return initialWatch();
                    } );
                } );

                // Since this is done before parsing, it can provide us with useful info
                element.on( "keydown", function( e ) {
                    prevValue = element.val();
                    prevCaretPos = getCaretPosition( element[ 0 ] );

                    // Determines which way the cursor should move
                    if ( e.which === 8 || e.which === 27 ) {
                        cursorMoves = "left";
                    } else {
                        cursorMoves = "right";
                    }
                } );
            }
        }

        /**
         * Sets the view value as the formatted number
         */
        function setModelFormatters() {
            ngModel.$formatters.push( function( value ) {
                var formattedNumber = phoneNumber.getFormattedNumber( value );

                // Replace the text if it's not an input
                if ( !isInput ) {
                    element.text( formattedNumber );
                }

                return formattedNumber;
            } );
        }

        /**
         * Sets the view value as a number trimmed of any other characters
         */
        function setModelParsers() {
            ngModel.$parsers.push( function( value ) {
                // Very simple throttling.  Perhaps could use ngModels debounce instead?
                var timeSinceLastUpdated = Date.now() - lastUpdated;
                lastUpdated = Date.now();

                if ( timeSinceLastUpdated > 50 ) {
                    // Calculation done here so that the user doesn't see a flash of the unformatted number
                    var newValues = getViewValueAndCaretPosition( value );

                    updateModel( newValues.value );
                    setCaretPos( newValues.caretPosition );

                    return newValues.value;
                }

                return value;
            } );
        }



        /**
         * Gets the new view value and caret position using
         * @param  {str} value Input from user
         * @return {obj}       Object with properties value and caretPosition
         */
        function getViewValueAndCaretPosition( value ) {
            var parsedValue = phoneNumber.getFormattedNumber( value ),
                valueSpec = getValueSpec( parsedValue ),
                caretPosition = getCaretPosition( element[ 0 ] ),
                valueLen = parsedValue.length,
                prevLen = prevValue.length;

            // Account for if + is pressed inside the first bracket
            if ( parsedValue.charAt( 1 ) === "+" ) {
                return {
                    caretPosition: caretPosition - 1,
                    value: "+" + valueSpec.trimmedVal
                }
            }

            // Check if letter was pressed
            if ( isLetter( value ) ) {
                if ( isInput ) {
                    element.addClass( "bg-danger" );

                    $timeout( function() {
                        element.removeClass( "bg-danger" );
                    }, 100 );
                }

                // Strip out letter and immediately rerender
                return {
                    caretPosition: caretPosition - 1,
                    value: parsedValue.replace( /[A-Za-z]/g, '' )
                }
            }

            // If the values are different by a factor of one or zero
            if ( valueSpec.hasOneCharDifference ) {
                if ( valueSpec.isInternationalNumber ) {
                    // Get non-didget values (+,' ', - etc)
                    var nonNumericCharLen = getNonNumericChars( prevValue.slice( 0, cursorMoves === "left" ? prevCaretPos - 1 : prevCaretPos + 1 ) ).length;

                    caretPosition = caretPosition - nonNumericCharLen;

                    for ( var i = 0; i <= caretPosition; i++ ) {
                        if ( isNonNumbericChar( parsedValue.charAt( i ) ) ) {
                            caretPosition++;
                        }
                    }
                } else {
                    if ( !valueSpec.hasNonDigitDifference ) {
                        if ( !valueSpec.isDidgetAdded ) {
                            if ( valueSpec.isNumberAfterDashRemoved ) {
                                parsedValue = parsedValue.substring( 0, 9 );
                            }
                        } else {
                            if ( valueSpec.trimmedValLen === 6 ) {
                                parsedValue += "-";
                            } else if ( parsedValue.charAt( caretPosition - 1 ) === "-" ) {
                                caretPosition++;
                            }
                        }
                    }
                }

                caretPosition = fixCaretPosition( parsedValue, caretPosition );
            }

            prevValue = parsedValue;
            prevCaretPos = caretPosition;

            return {
                caretPosition: caretPosition,
                value: parsedValue
            }
        }

        function fixCaretPosition( value, caretPosition ) {
            while ( isNonNumbericChar( value[ cursorMoves === "left" ? caretPosition - 1 : caretPosition ] ) ) {
                caretPosition = cursorMoves === "left" ? caretPosition - 1 : caretPosition + 1;
            }

            return caretPosition;
        }

        /**
         * Update Model View Value - does not update actual model value
         * @param  {str} value New view value
         */
        function updateModel( value ) {
            ngModel.$setViewValue( value );
            ngModel.$render();
        }

        /**
         * Returns some valures that are used in various calculation.
         * @param  {str} value Formatted number
         * @return {obj}       Returned set of variables corresponding to this
         */
        function getValueSpec( value ) {
            var viewVars = {
                trimmedVal: phoneNumber.trim( value ),
                trimmedPrev: phoneNumber.trim( prevValue ),
                hasOneCharDifference: lodash.inRange( value.length - prevValue.length, -2, 2 ),
                isInternationalNumber: phoneNumber.isInternational( value ),
                isDidgetAdded: value.length > prevValue.length,
            }
            viewVars.trimmedValLen = viewVars.trimmedVal.length;
            viewVars.hasNumberChanged = viewVars.trimmedVal !== viewVars.trimmedPrev;
            viewVars.hasNonDigitDifference = viewVars.hasOneCharDifference && !viewVars.hasNumberChanged;
            viewVars.isNumberAfterDashRemoved = !viewVars.isInternationalNumber && value.length < prevValue.length && viewVars.hasOneCharDifference && value.length === 10;

            return viewVars;
        }


        /**
         * Update caret position if number added/removed
         * @param {int} caretPos Index of new caret
         */
        function setCaretPos( caretPos ) {
            element[ 0 ].setSelectionRange( caretPos, caretPos );
        }

        /**
         * Get current position of caret.  Taken from http://flightschool.acylt.com/devnotes/caret-position-woes/
         * @param  {dom element} oField Input from which to get the caret
         * @return {int}        Current position of caret
         */
        function getCaretPosition( oField ) {
            var iCaretPos = 0;

            if ( document.selection ) { // IE Support
                oField.focus();
                var oSel = document.selection.createRange();
                oSel.moveStart( "character", -oField.value.length );
                iCaretPos = oSel.text.length;
            } else if ( oField.selectionStart || oField.selectionStart == "0" ) {
                iCaretPos = oField.selectionStart;
            }

            return iCaretPos;
        };

        function getNonNumericChars( number ) {
            var match = number.match( /[^0-9]+/g );
            return !lodash.isNull( match ) ? match : [];
        }

        function isNonNumbericChar( char ) {
            return [ "(", ")", " ", "-", "+" ].indexOf( char ) !== -1;
        }

        function isLetter( number ) {
            return number.match( /[A-Za-z]/g ) !== null && number.match( /[x]/g ) === null;
        }
    }
}
