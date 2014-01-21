$(function() {
	var initialize = function() {

	}

	var getNewLocation = function() {
		return {
			'lat': 37.775002,
			'lng': -122.418297
		};
	}

	var getNeighborhoodFromLatLng = function(lat, lng) {
		return "SOMA";
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

	loadStreetViewWithLatLng(37.775732, -122.413985);
});