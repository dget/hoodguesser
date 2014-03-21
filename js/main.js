$(function() {

    // Hide the welcome screen if you've seen it
    if (window.location.hash == '') {
      window.location.hash = "alreadyseen";
    } else {
      $('#welcome-screen').hide();
    }

    // Hide the welcome screen if you click the button
    $('#welcome-screen button').click(function () {
        $('#welcome-screen').hide();
    })

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
                    var guessedNeighborhood = feature.properties.name;

                    if (guessedNeighborhood == correctNeighborhood) {
                        alert("You got it! This is " + correctNeighborhood + ".")
                        window.location.reload();
                    } else {
                        alert("Oops! It was " + correctNeighborhood + ", not " + guessedNeighborhood + ".");
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

    correctNeighborhood = null;
    sampleLocation = null;
    // TODO: catch bad locations
    var points = [];
    $.get('data/sf_pts.json', function(pts) {
        sampleLocation = pts[Math.floor(Math.random() * pts.length)];
        correctNeighborhood = sampleLocation['neighborhood'];
        console.log(sampleLocation);
        loadStreetViewWithLatLng(sampleLocation['lat'], sampleLocation['lng']);
    })


});
