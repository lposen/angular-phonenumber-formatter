angular.module("phoneNumberFormatter")
    .service("lodash", lodash);

/* ngInject */
function lodash($window) {
    if ($window && $window._) {
        return $window._;
    } else {
        throw new Error('Cannot find lodash.  Please make sure library is included!');
    }
}
