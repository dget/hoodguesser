$(function() {
	// Constants


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

	// BEGIN choosing-map code
	/*
	 * Adapted from front-end code written (mostly) by Marcin Wichary, Code for America
	 * as part of Click That 'Hood (https://github.com/codeforamerica/click_that_hood)
	 */


	// TODO: handle resizing
	// TODO: loading progress

	// constants
	var MAP_SELECTOR = "#map";
	var D3_DEFAULT_SCALE = 500;
	var MAPS_DEFAULT_SCALE = 512;
	var MAP_BACKGROUND_DEFAULT_ZOOM = 12;

	var MAP_HORIZONTAL_OFFSET_NORMAL = 0;
	var MAP_HORIZONTAL_OFFSET_REVERSED = 1;

	// variables
	var geoData; // geoJSON info about the city
	var mapSvg; // refers to svg element from d3
	var geoMapPath; 
	var mapWidth;
	var mapHeight;
	var mainMenu = false; // are we at the main menu?
	var mapHorizontalOffset = MAP_HORIZONTAL_OFFSET_NORMAL;

	// functions
	var updateCanvasSize = function() {
		mapWidth = $(MAP_SELECTOR).width();
		mapHeight = $(MAP_SELECTOR).height();
	}

	var createSvg = function() {
		updateCanvasSize();

		mapSvg = d3.select('#svg-container').append('svg')
      		.attr('width', mapWidth)
 		    .attr('height', mapHeight);  
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

	function sanitizeName(name) {
		name = name.replace(/[\n\r]/g, '');
		return name;
	}

	var createMap = function() {
		var mapContents = mapSvg
			.selectAll('path')
			.data(geoData.features)
			.enter()
			.append('path')
			.attr('d', geoMapPath.pointRadius(1))
			.attr('class', 'neighborhood unguessed')
			.attr('name', function(d) { return sanitizeName(d.properties.name);})
			.on('click', function(d) {
				var el = d3.event.target || d3.event.toElement;
				var neighborhoodChosen = el.attributes.name.value;
				alert(neighborhoodChosen);
			})
			.on('mouseover', function(d) {
				var el = d3.event.target || d3.event.toElement;
				el.classList.add('hover');
			})
			.on('mouseout', function(d) {
				var el = d3.event.target || d3.event.toElement;
				el.classList.remove('hover');
			})
	}

	function findBoundaries() {
	  // TODO const
	  var minLat = 99999999;
	  var maxLat = -99999999;
	  var minLon = 99999999;
	  var maxLon = -99999999;

	  // TODO move outside
	  function findMinMax(lon, lat) {
	    switch (mapHorizontalOffset) {
	      case MAP_HORIZONTAL_OFFSET_REVERSED:
	        lon += 360;
	        lon %= 360;
	        break;
	    }

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
	  	// TODO: update this to properly handle many cities
		// if (CITY_DATA[cityId].pointsInsteadOfPolygons) {
		if (false) {
	      var lon = geoData.features[i].geometry.coordinates[0]
	      var lat = geoData.features[i].geometry.coordinates[1];

	      findMinMax(lon, lat);
	    } else {
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
	  }

	  return { 
	    minLat: minLat,
	    maxLat: maxLat,
	    minLon: minLon,
	    maxLon: maxLon
	  }
	}

	function lonToTile(lon, zoom) { 
	  return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
	}

	function latToTile(lat, zoom) { 
	  return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 
	      1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
	}

	function tileToLon(x, zoom) {
	  return x / Math.pow(2, zoom) * 360 - 180;
	}

	function tileToLat(y, zoom) {
	  var n = Math.PI - 2 * Math.PI * y / Math.pow(2, zoom);
	  return 180 / Math.PI * Math.atan(.5 * (Math.exp(n) - Math.exp(-n)));
	}

	function calculateMapSize() {
		if (mainMenu) {
		geoMapPath = d3.geo.path().projection(
		    d3.geo.mercator().center([0, 0]).
		    scale(640 / 6.3).
		    translate([256 + 512 + 213 - 88 + (mapWidth % 640) / 2 - 621 / 2, 256]));
		} else {
		var boundaries = findBoundaries();

		if ((boundaries.minLon == -180) && (boundaries.maxLon == 180)) {
		  mapHorizontalOffset = MAP_HORIZONTAL_OFFSET_REVERSED;
		  boundaries = findBoundaries();
		}

		centerLat = (boundaries.minLat + boundaries.maxLat) / 2;
		centerLon = (boundaries.minLon + boundaries.maxLon) / 2;
		latSpread = boundaries.maxLat - boundaries.minLat;
		lonSpread = boundaries.maxLon - boundaries.minLon;

	  	// TODO: update this to properly handle many cities
		// if (CITY_DATA[cityId].pointsInsteadOfPolygons) {
		if (false) {
		  latSpread *= 1.1;      
		  lonSpread *= 1.1;      
		}

		updateCanvasSize();

		var zoom = MAP_BACKGROUND_DEFAULT_ZOOM;
		var tile = latToTile(centerLat, zoom);
		var latStep = (tileToLat(tile + 1, zoom) - tileToLat(tile, zoom));

		// Calculate for height first
		// TODO: not entirely sure where these magic numbers are coming from
		globalScale = 
		    ((D3_DEFAULT_SCALE * 180) / latSpread * (mapHeight - 50)) / 
		        MAPS_DEFAULT_SCALE / 0.045 * (-latStep);

		// Calculate width according to that scale
		var width = globalScale / (D3_DEFAULT_SCALE * 360) * 
		    lonSpread * MAPS_DEFAULT_SCALE;

		if (width > mapWidth) {
		  globalScale = ((D3_DEFAULT_SCALE * 360) / lonSpread * mapWidth) / 
		      MAPS_DEFAULT_SCALE;
		}

		projection = d3.geo.mercator();
		switch (mapHorizontalOffset) {
		  case MAP_HORIZONTAL_OFFSET_NORMAL:
		    projection = projection.center([centerLon, centerLat]);
		    break;
		  case MAP_HORIZONTAL_OFFSET_REVERSED:
		    projection = projection.center([centerLon - 180, centerLat]).
		        rotate([180, 0]);    
		    break;
		}
		projection = projection.scale(globalScale / 6.3).
		    translate([mapWidth / 2, mapHeight / 2]);

		geoMapPath = d3.geo.path().projection(projection);
		}
	}

	var everythingLoaded = function() {
		calculateMapSize();
		createMap();
	}

	initialize();
	createSvg();
	loadData(everythingLoaded)
	loadStreetViewWithLatLng(37.775732, -122.413985);

});