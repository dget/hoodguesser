$(function() {

    var initialize = function() {
        // TODO: check browser compatibility
        // TODO: figure out how we're handling touch... 
        //setTouchActive(Modernizr.touch);


    }

    var getNewLocation = function() {
        return {
            'lat': 37.775002,
            'lng': -122.418297
        };
    }

    var getNeighborhoodFromLatLng = function(lat, lng) {
        return "South of Market";
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
            }
        };

        var panorama = new google.maps.StreetViewPanorama(document.getElementById("streetview"), panoramaOptions);
    }

    // BEGIN map code
    var MAPBOX_MAP_ID = 'codeforamerica.h4ghhj23';

    var map = L.mapbox.map('map', MAPBOX_MAP_ID, {zoomControl: false});
    map.dragging.disable();
    map.touchZoom.disable();
    map.doubleClickZoom.disable();
    map.scrollWheelZoom.disable();

    if (map.tap) {
        map.tap.disable();
    }

    // source: adapted from Click That Hood
    // Finds the boundaries of the map containing geoData
    function findBoundaries(geoData) {

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

    var loadData = function(callback) {
        var url = 'data/san-francisco.geojson';
        $.ajax({
            dataType: 'json',
            url: url, 
            success: function(data) {
                geoData = data;
                callback(data);
            },
            error: function() {
                    // TODO: handle this error
                }
            });
    }

    loadData(function (data) {
        boundaries = findBoundaries(data);

        console.log(boundaries);

        var neighborhoodLayer = L.geoJson(data, {
            onEachFeature: function(feature, layer) {
                layer.on('mouseover', function() {
                    layer.setStyle({
                        fillColor: 'black'
                    });

                })
                .on('mouseout', function() {
                    layer.setStyle({
                        fillColor: 'blue'
                    })
                })
                .on('click', function() {
                    var name = feature.properties.name;
                    
                    if (name == correctNeighborhood) {
                        alert("You got it! Good job.")
                        window.location.reload();
                    } else {
                        alert("Sorry :(. It was " + correctNeighborhood + ", not " + name + ".");
                        window.location.reload();
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

    });

    // TODO: catch bad locations
    neighborhood_pts = {
        'North Beach': [{'lat': 37.801193, 'lng': -122.410952}],
        'Russian Hill': [{'lat': 37.799155, 'lng': -122.419091}],
        'Marina': [{'lat': 37.806334, 'lng': -122.437492}],
        'Seacliff': [{'lat': 37.788677, 'lng': -122.488052}],
        'Bayview': [{'lat': 37.739317, 'lng': -122.390312}],
        'Visitacion Valley': [{'lat': 37.713104, 'lng': -122.413386}],
        'Excelsior': [{'lat': 37.725024, 'lng': -122.434545}],
        'Bernal Heights': [{'lat': 37.742885, 'lng': -122.409361}],
        'Mission': [{'lat': 37.755988, 'lng': -122.418826}],
        'Noe Valley': [{'lat': 37.751383, 'lng': -122.432719}],
        'Castro/Upper Market': [{'lat': 37.760059, 'lng': -122.434908}],
        'Potrero Hill': [{'lat': 37.759623, 'lng': -122.403061}],
        'South of Market': [{'lat': 37.777528, 'lng': -122.413098}]
    }
    neighborhoods = Object.keys(neighborhood_pts);

    correctNeighborhood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)];
    sampleLocation = neighborhood_pts[correctNeighborhood][0];
//    correctNeighborhood = sampleLocation['neighborhood']; /*getNeighborhoodFromLatLng(sampleLocation['lat'], sampleLocation['lng']);*/
    console.log(correctNeighborhood);
    loadStreetViewWithLatLng(sampleLocation['lat'], sampleLocation['lng']);
});

