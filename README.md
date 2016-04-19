This library formats American national numbers and international numbers using Angular, [Googles i18n Phone Number Formatter](https://github.com/googlei18n/libphonenumber).

[See Demo](http://lposen.github.io/angular-phonenumber-formatter/demo)

NOTE: This was made for a specific project, so is not very configurable.

## Requirements

- AngularJS
- Lodash

## Assumptions
- National numbers are American numbers.  They will be decorated as (###) ###-####.
- X's are not stripped from national numbers as they could be the precursor for extensions.  Other letters are.
- X's are stripped from international extensions (a company decision)
- If a national number has more than 10 digits, it will format the first 10 digits and append the rest, seperated by a space.
  * Eg: 1234567890x123 becomes (123) 456-7890 x123
- International numbers will begin with a "+" to differentiate them from national numbers

## Usage
### Setup
Add the module as a dependency


    angular.module( "app", [
       "phoneNumberFormatter"
    ] );

### Input
Add "phone-number" as an attribute and the value as ng-model


    <input type="text" ng-model="myPhoneNumber" phone-number></input>


### Element
Use "phone-number" as an attribute or element. Add the value as ng-model.
If you're using it as an attribute, be aware that it creates an isolate scope, so you cannot use another attribute that creates an isolate scope on the same element


    <phone-number ng-model="myPhoneNumber"></phone-number>

or

    <p phone-number ng-model="myPhoneNumber"></p>


### Filter

    <p>{{myPhoneNumber|phoneNumber}}</p>
or

    $scope.myPhoneNumber = $filter('phoneNumber')($scope.myPhoneNumber);

### Factory (PhoneNumberFormatter)

    var myNum = 1234567890,
        numberFormatter = new PhoneNumberFormatter();

    var formattedNumber = numberFormatter.getFormattedNumber(myNum); //(123) 456-7890
    var isInternational = numberFormatter.isInternational(myNum); //false
    var unformattedNumer = numberFormatter.trim(myNum); //1234567890



## Demo
1. Download app
2. cd into "demo"
3. Run "npm install"
4. Run "bower install"
5. Run "grunt serve"
