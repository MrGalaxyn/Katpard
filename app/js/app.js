'use strict';

define([
    'app',
    'modules/navbar/navbar',
    'modules/topbar/topbar',
    'common/services/routeResolver'
], function () {

    var app = angular.module('app', ['ngRoute', 'routeResolverServices']);

    app.config(['$routeProvider', 'routeResolverProvider', '$controllerProvider', '$compileProvider', '$filterProvider', '$provide', '$httpProvider',
        function ($routeProvider, routeResolverProvider, $controllerProvider, $compileProvider, $filterProvider, $provide, $httpProvider) {

            // change default views and controllers directory using the following:
            routeResolverProvider.routeConfig.setBaseDirectories('partials/', 'js/modules/');

            app.register =
            {
                controller: $controllerProvider.register,
                directive: $compileProvider.directive,
                filter: $filterProvider.register,
                factory: $provide.factory,
                service: $provide.service
            };

            // define routes - controllers will be loaded dynamically
            var route = routeResolverProvider.route;

            $routeProvider
                // route.resolve() now accepts the convention to use (name of controller & view) as well as the 
                // path where the controller or view lives in the controllers or views folder if it's in a sub folder. 
                // For example, the controllers for customers live in js/modules/customers and the views are in partials/customers.
                // The controllers for orders live in controllers/orders and the views are in views/orders
                // The second parameter allows for putting related controllers/views into subfolders to better organize large projects
                // visit MEAN.io for more detail
                .when('/configure', route.resolve('configure', 'configure/'))
                .when('/externalCharts', route.resolve('externalCharts', 'externalCharts/'))
                .when('/interface', route.resolve('interface', 'interface/'))
                .when('/ria', route.resolve('ria', 'ria/'))
                .otherwise({redirectTo: '/ria'});
    }]);

    return app;

});

