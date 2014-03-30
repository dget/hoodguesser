$(function() {

    // global constants
    var MAPBOX_MAP_ID = 'codeforamerica.h4ghhj23';

    // global variables
    var correctNeighborhood = null;
    var sampleLocation = null;
    var currentCity = 'san-francisco';
    var map;
    var boundaries;
    var points;

    var startGame = function() {
        setSplashScreenHandler();
        initializeMapBox();
        loadNeighborhoodData(initializeNeighborhoodMapWithGeoJson, logError);
        loadPointsData(startNewRound, logError);
    }

    var startNewRound = function () {
        locationToShow = points[Math.floor(Math.random() * points.length)];
        correctNeighborhood = locationToShow['neighborhood'];
        loadStreetViewWithLatLng(locationToShow['lat'], locationToShow['lng']);
    }


    var setSplashScreenHandler = function() {
        // Hide the welcome screen if you click the button
        $('#welcome-screen button').click(function () {
            $('#welcome-screen').hide();
        });
    }

    var loadStreetViewWithLatLng = function(lat, lng) {
        var latLng = new google.maps.LatLng(lat, lng);

        var mapOptions = {
            center: latLng,
            zoom: 8
        };

        var panoramaOptions = {
            position: latLng,
            pov: {
                heading: 45,
                pitch: 10
            },
            addressControl: false,
            linksControl: false,
            panControl: false
        };

        var panorama = new google.maps.StreetViewPanorama(document.getElementById("streetview"), panoramaOptions);
    }

    // BEGIN map code
    var initializeMapBox = function() {
        map = L.mapbox.map('map', MAPBOX_MAP_ID, {zoomControl: false});
        map.dragging.disable();
        map.touchZoom.disable();
        map.doubleClickZoom.disable();
        map.scrollWheelZoom.disable();

        if (map.tap) {
            map.tap.disable();
        } 
    };
    

    // source: adapted from Click That Hood
    // Finds the lat/lng boundaries of a map containing given geoData
    var findBoundaries = function(geoData) {

        // TODO const
        var minLat = 99999999;
        var maxLat = -99999999;
        var minLon = 99999999;
        var maxLon = -99999999;

        // TODO move outside
        function findMinMax(lon, lat) {
            if (lat > maxLat) {
                maxLat = lat;
            }
            if (lat < minLat) {
                minLat = lat;
            }

            if (lon > maxLon) {
                maxLon = lon;
            }
            if (lon < minLon) {
                minLon = lon;
            }
        }

        for (var i in geoData.features) {
            for (var z in geoData.features[i].geometry.coordinates) {
                for (var j in geoData.features[i].geometry.coordinates[z]) {
                    if (geoData.features[i].geometry.coordinates[z][j].length &&
                      typeof geoData.features[i].geometry.coordinates[z][j][0] != 'number') {
                        for (var k in geoData.features[i].geometry.coordinates[z][j]) {
                            var lon = geoData.features[i].geometry.coordinates[z][j][k][0];
                            var lat = geoData.features[i].geometry.coordinates[z][j][k][1];

                            findMinMax(lon, lat);
                        }
                    } else if (geoData.features[i].geometry.coordinates[z][j].length) {
                        var lon = geoData.features[i].geometry.coordinates[z][j][0];
                        var lat = geoData.features[i].geometry.coordinates[z][j][1];

                    findMinMax(lon, lat);
                    }
                }
            }
        }

        return [[minLat, minLon],
                [maxLat, maxLon]];
    }

    // loads JSON file with lat/lng/neighborhood combos for points to be selected from
    var loadPointsData = function(success, error) {
        var url = 'data/' + currentCity + '-points.json';
        $.ajax({
            dataType: 'json',
            url: url,
            success: function(pts) {
                points = pts;
                success(pts);
            },
            error: error
        });
    }

    // loads geoJSON file with polygons representing neighborhoods
    var loadNeighborhoodData = function(success, error) {
        var url = 'data/' + currentCity + '.geojson';
        $.ajax({
            dataType: 'json',
            url: url,
            success: success,
            error: error
            });
    }

    var initializeNeighborhoodMapWithGeoJson = function(data) {
        boundaries = findBoundaries(data);

        var neighborhoodLayer = L.geoJson(data, {
            onEachFeature: function(feature, layer) {
                layer.bindPopup(feature.properties.name,
                  { closeButton: false,
                    offset: [0, 10],
                    autoPan: false}
                );
                layer.on('mouseover', function() {
                    layer.setStyle({
                        fillColor: 'black'
                    });
                    layer.openPopup();

                })
                .on('mouseout', function() {
                    layer.setStyle({
                        fillColor: 'blue'
                    })
                })
                .on('click', function() {
                    var guessedNeighborhood = feature.properties.name;

                    if (guessedNeighborhood == correctNeighborhood) {
                        handleCorrectGuess(guessedNeighborhood, correctNeighborhood);
                    } else {
                        handleIncorrectGuess(guessedNeighborhood, correctNeighborhood);
                    }
                });
            },
            style: function() {
                return {
                    weight: 2,
                    opacity: 0.8,
                    fillColor: 'blue'
                }
            }
        }).addTo(map);
        map.fitBounds(boundaries);
    };

    var handleCorrectGuess = function(guessedNeighborhood, correctNeighborhood) {
        alert("You got it! This is " + correctNeighborhood + ".")
        startNewRound();
    };

    var handleIncorrectGuess = function(guessedNeighborhood, correctNeighborhood) {
        alert("Oops! It was " + correctNeighborhood + ", not " + guessedNeighborhood + ".");
        startNewRound();
    };

    var logError = function() {
        console.error(arguments);
    }

    startGame();
});
