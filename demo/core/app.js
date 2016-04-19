angular.module( "app", [
    "phoneNumberFormatter",
    "ui.ace"
] );

angular.module( "app" )
    .controller( "appController", appController );

function appController( $scope ) {
    angular.extend( $scope, {
        international: {
            phoneNumber: "+27828944243",
            inputHtml: '<input type="text" ng-model="international.phoneNumber" phone-number></input>',
            elementHtml: '<phone-number ng-model="international.phoneNumber"></phone-number>',
            filterHtml: '<p>{{international.phoneNumber|phoneNumber}}</p>'
        },
        national: {
            phoneNumber: 5169728367,
            inputHtml: '<input type="text" ng-model="national.phoneNumber" phone-number></input>',
            elementHtml: '<phone-number ng-model="national.phoneNumber"></phone-number>',
            filterHtml: '<p>{{national.phoneNumber|phoneNumber}}</p>'
        }
    } )
}
