angular.module( 'Etherboard', ['ngRoute', 'ngResource'] )
    .factory( 'EntrySpreadsheet', function($resource){
        return $resource('http://bluerock:8000/:id'); // Note the full endpoint address
    } )
    .factory( 'usersService', ['$rootScope', function( $rootScope ) {  
        var user = {};
        var loggedIn = false;
        return{
            setUser : function( daUser ) {  
                user = daUser;
                loggedIn = true;
                $rootScope.$broadcast( 'userLoggedIn' );
            },
            getUser : function() {
                return user;
            },
            hasUser : function() {
                return loggedIn;
            },
            logout : function( daLocation ) {
                this.setUser( {} );
                loggedIn = false;
                $rootScope.$broadcast( 'userLoggedOut' );
                daLocation.path( "/" );
                daLocation.replace();
            }
        }
    } ] )
    .config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider){
         //$locationProvider.html5Mode( true );
            $routeProvider.when( '/', {
                templateUrl : './index.jade',
                controller : 'HomeCtrl'
            } );
            $routeProvider.when( '/daview', {
                templateUrl : './daview.jade',
                controller : 'CamCtrl'
            } );
            $routeProvider.when( '/about', {
                templateUrl : './about.jade',
                controller : 'AboutCtrl'
            } );
    }])
    .controller( 'NavbarCtrl', ['$scope', '$location', 'usersService', 'EntrySpreadsheet', function($scope, $location, usersService){  
        $scope.hasUser = false;
        $scope.aboutClk = function() {
            $location.path( '/about' );
            $location.replace();
        };
        $scope.daviewClk = function() {
            $location.path( '/daview' );
            $location.replace();
        };
        $scope.refreshUser = function(){
            $scope.hasUser = usersService.hasUser();
        };
        $scope.logout = function() {
            usersService.logout( $location );
        };
        $scope.$on( 'userLoggedIn', function( event ) {  
            $scope.refreshUser();
        } );
        $scope.$on( 'userLoggedOut', function( event ) {  
            $scope.refreshUser();
        } );               
    }] )
    .controller( 'AboutCtrl', ['$scope', '$location', function($scope, $location){  
        $scope.daviewClk = function() {
            console.log( "going to daview" );
            $location.path( '/daview' );
            $location.replace();
        };
    }] )
    .controller( 'HomeCtrl', [ '$rootScope', '$scope', '$http', '$location', 'usersService', 'EntrySpreadsheet', function( $rootScope, $scope, $http, $location, usersService, EntrySpreadsheet ){
        $scope.data1 = [1,3,4,15,22,27,7];
        $scope.data2 = [21,19,40,42,24,21];
        $scope.data3 = ["Andy","Andy","Andy","Billy","Billy","Charlie","Charlie","Charlie","Charlie"];
        $scope.dataset = {};
        $scope.dataheaders = [];
        
        // default plotting variables
        $scope.pw = 300;  // plot width
        $scope.ph = 300;  // plot height
        $scope.pp = 10;    // plot padding
        $scope.pylab = 50;// plot width for y label
        $scope.pxlab = 30;// plot width for x label
        $scope.barFill = "#dd2020"; // bar fill color
        $scope.barHeight = 10;
        $scope.fontSize = "9px";
        
        $scope.minOfCol = function( nc ) {
            return d3.min($scope.dataset, function(d) { return parseFloat( d[nc-1] ) } );    
        };
        $scope.maxOfCol = function( nc ) {
            return d3.max( $scope.dataset, function(d) { return parseFloat( d[nc-1] ) } );
        };
        $scope.makeScale = function ( dlo, dhi, rlo, rhi, stype ) {    
            // default create linear scale
            var scl = d3.scale.linear()
                          .domain( [ dlo, dhi ] )
                          .range( [ rlo, rhi ] );
            return scl;    
        };
        
        $scope.makeSVG = function( sHeight ) {
            var s = d3.select( "#Plots" )
                          .append( "svg" )
                          .attr( "width", 300 )
                          .attr( "height", sHeight )
                         .attr( "class", "svg-graph-component");
            return s;
        };
        
        $scope.getSpreadsheetData = function( callback ) {
            $http.get( "http://bluerock:8000/test.csv.json" ).success( function( data ) {  
                $scope.dataheaders = data[ 0 ];
                $scope.dataset = data.splice( 1, data.length );
                   console.log( $scope.dataset );
                callback();
            } );
        };
        
        $scope.plotBar = function() {
            $scope.getSpreadsheetData( function() {

                var col = $scope.barCol;
                var maxd = $scope.maxOfCol( col );
                var mind = $scope.minOfCol( col );
                var rCount = $scope.dataset.length;
                var svgHeight = $scope.pxlab + ( rCount * $scope.barHeight ) + ( $scope.pp * 2 ) + $scope.pxlab;
                
                console.log( "plotting Bar..." );
                console.log( "svgHeight %d", svgHeight );
                var svg = $scope.makeSVG( svgHeight );
                
                var scale = $scope.makeScale( 0, maxd , 0 , $scope.pw - ( $scope.pylab + 2 * $scope.pp ) , "linear" );
                
                // title
                var gtitle = svg.append( "g" );
                gtitle.append( "text" )
                    .text( $scope.dataheaders[ col - 1 ] + " by " + $scope.dataheaders[ 0 ] )
                    .attr( "x", $scope.pp + $scope.pylab )
                    .attr( "y", $scope.pxlab )
                    .attr( "font-size", "20px" );
                
                
                // ylabels 
                var glabels = svg.append( "g" );
                glabels.selectAll( "text" )
                    .data( $scope.dataset )
                    .enter()
                    .append( "text" )
                    .text( function( d ) { return d[ 0 ]; } )
                    .attr("x", $scope.pp )
                    .attr("y", function( d, i ) { return $scope.pp + $scope.pxlab - 3 + (i+1) * ( $scope.barHeight+1);  }  )
                    .attr( "font-size", $scope.fontSize );

                
                // the bars    
                svg.selectAll("rect")
                    .data( $scope.dataset )
                    .enter()
                    .append( "rect" )
                    .attr( "x", $scope.pylab + $scope.pp )
                    .attr( "y", function( d, i ) { return $scope.pp + $scope.pxlab + i*($scope.barHeight+1); } )
                    .attr( "width", function(d){ return scale( d[ col-1 ] ); } )
                    .attr( "height", $scope.barHeight )
                    .attr( "fill", $scope.barFill );
                
                // values
                var gvalues = svg.append( "g" );
                gvalues.selectAll( "text" )
                    .data( $scope.dataset, function( d ) { return d[ col-1 ] } )
                    .enter()
                    .append( "text" )
                    //.transition()
                    .text( function( d ) { return d[ col-1 ]; } )
                    .attr("x", $scope.pp * 2 + $scope.pylab )
                    .attr("y", function( d, i ) { return $scope.pp + $scope.pxlab - 3 + (i+1) * ( $scope.barHeight+1);  }  )
                    .attr( "font-size", $scope.fontSize );
                    
                // Axis
                var gaxis = svg.append( "g" )
                        .attr( "class", "axis" )
                        .attr("transform", "translate(" + ($scope.pp+$scope.pylab) + "," + ( svgHeight - $scope.pxlab ) + ")");
                gaxis.call(
                    d3.svg.axis()
                    .scale( scale )
                    .orient( "bottom" )
                );
                    
            });
        };
        
        $scope.plotLine = function() {
            console.log( "plotting Line..." );
        };
        
        $scope.plotPie = function() {
           console.log( "plotting Pie..." );
           var svg = d3.select( "#Plots" )
                         .append( "svg" )
                         .attr( "width", 300 )
                         .attr( "height", 300 )
                         .attr( "class", "svg-graph-component");
            var w = 290;
            var h = 290;
            var outerRadius = w / 2;
			var innerRadius = 0;
			var arc = d3.svg.arc()
							.innerRadius(innerRadius)
							.outerRadius(outerRadius);
			
			var pie = d3.layout.pie();
			
			//Easy colors accessible via a 10-step ordinal scale
			var color = d3.scale.category10();

			//Set up groups
			var arcs = svg.selectAll("g.arc")
						  .data(pie($scope.data1))
						  .enter()
						  .append("g")
						  .attr("class", "arc")
						  .attr("transform", "translate(" + outerRadius + "," + outerRadius + ")");
			
			//Draw arc paths
			arcs.append("path")
			    .attr("fill", function(d, i) {
			    	return color(i);
			    })
			    .attr("d", arc);
			
			//Labels
			arcs.append("text")
			    .attr("transform", function(d) {
			    	return "translate(" + arc.centroid(d) + ")";
			    })
			    .attr("text-anchor", "middle")
			    .text(function(d) {
			    	return d.value;
			    });
        };
        $scope.username = "";
        $scope.userpassw = "";
        $scope.attemptLogin = function() {
            $http.post( 'http://bluerock:3000/login', { username:$scope.username, passw:$scope.userpassw } ).success( function( data ) {  
                if( data.authed == "pass" ) {
                    usersService.setUser( data );
                    $location.path( '/daview' );
                    $location.replace();
                } else { 
                    alert( "Login Failed!" );
                }
            } );
            $scope.username = "";
            $scope.userpassw = "";
        };
        
        init();
        
        function init() {
            console.log("Hello!");
        };    
    } ] )
    .controller( 'CamCtrl', [ '$scope', '$location', 'usersService', function($scope, $location, usersService){
        $scope.hyper = {};
        $scope.daPic = "./daview/webcam.jpg";
        $scope.messages = [];
        $scope.streamingImage = false;
        $scope.streamImageBtnCaption = "Start Continuous Imaging";
        $scope.streamingSensor = false;
        $scope.streamSensorBtnCaption = "Start Sensor Stream";
        
        $scope.getMessages = function() {
            return $scope.messages;
        };
        
        $scope.fadeMsg = function() {
            $scope.$apply( function() {
                $scope.messages.splice( 0, 1 );
            } );
        };
        
        $scope.queueMessage = function( someText ) {
            $scope.$apply( function() {
                $scope.messages.push( someText + " __________ " + (new Date() ) );
            } );
            setTimeout( function() {  
                $scope.fadeMsg();
            }, 5000 );
        };
        
        $scope.putMessage = function( someString ) {
            $scope.messages.push( someString + " __________ " + ( new Date() ) );
            setTimeout( function() { 
                $scope.fadeMsg();
            }, 5000 );
        };
        
        $scope.toggleStreamImage = function() {
            if( $scope.streamingImage ) {
                $scope.imageStreamStop();   
            } else {
                $scope.putMessage( "Acquiring Images, Please Wait" );
                $scope.imageStreamStart();
            }
        };
        
        $scope.toggleStreamSensor = function() {
            if( $scope.streamingSensor ) {
                $scope.sensorStreamStop();
            } else {
                $scope.sensorStreamStart();
            }
        };
        
        $scope.setStreamImageCaption = function() {
            if( $scope.streamingImage )
                $scope.streamImageBtnCaption = "Stop Continuous Imaging";
            else {
                $scope.daPic = "./daview/webcam.jpg";
                $scope.streamImageBtnCaption = "Start Continuous Imaging";
                }
        };
        
        $scope.setStreamSensorCaption = function() {
            if( $scope.streamingSensor )
                $scope.streamSensorBtnCaption = "Stop Sensor Stream";
            else 
                $scope.streamSensorBtnCaption = "Start Sensor Stream";
        };
        
        $scope.imageStreamStart = function() {
            $scope.streamingImage = true;
            $scope.setStreamImageCaption();
            socket.emit( 'imgStartClient', {} );
        };     
        
        $scope.imageStreamStop = function() {
            $scope.streamingImage = false;
            $scope.setStreamImageCaption();
            socket.emit( 'imgStopClient', {} );
        };
                   
        $scope.sensorStreamStart = function() {
            $scope.streamingSensor = true;
            $scope.setStreamSensorCaption();
            socket.emit( 'scStartClient',{} );
        };
        
        $scope.sensorStreamStop = function() {
            $scope.streamingSensor = false;
            $scope.setStreamSensorCaption();
            socket.emit( 'scStopClient', {} );
        };
               
        $scope.panLeft = function() {
            socket.emit( 'panLeft', {} );
        };
        
        $scope.panRight = function() {
            socket.emit( 'panRight', {} );
        }
        
        socket.on( 'imgStopServer', function( data ) {  
            $scope.streamingImage = false;
            $scope.setStreamImageCaption();
            $scope.queueMessage( data.msg );
        } );
                
            socket.on( 'scStopServer', function(data) {  
            $scope.streamingSensor = false;
            $scope.setStreamSensorCaption();
            $scope.queueMessage( data.msg );
        } );
        
        socket.on( 'hyper', function( data ) {  
            $scope.$apply( function() {
                $scope.hyper = data;
            } );
        } );
        
        socket.on( 'refImg', function( data ) {
            if( $scope.streamingImage ) {
                $scope.$apply(function() {
                    $scope.daPic = "./daview/topsecret.jpg?" + Math.random() ;
                } );
            }
        } );
        
        socket.on( 'zonked', function( data ) { 
            $scope.queueMessage( "Can't Turn Servo Beyond This Point" );
        } );

        socket.on( 'notTooFast', function( data ) {  
            $scope.queueMessage( data.msg );
        } );
        
        $scope.logout = function() {
            usersService.logout( $location );
        }
        
        init();
        
        function init() {
            if( usersService.getUser().authed == "pass" ) {
                $scope.sensorStreamStart();            
            } else { // redirect to home if user has not logged in
                $location.path( '/' );
                $location.replace();
            }
        }
        
    } ] )
