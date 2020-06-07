var map;
// global infowindow used to prevent multiple windows being open
var currentInfoWindow;
// Create a new blank array for all the listing markers.
var markers = [];
function ViewModel() {

    var self = this;
    this.searchOption = ko.observable("");

    this.initMap = function() {

        // creates map
        map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: 39.425331, lng: -74.498337},
            zoom: 13,
            styles: styles,
            mapTypeControl: false
        });

        // add location markers for each location
        locations.forEach(function(location) {
            LocationMarker(location);
        });
    };
    this.initMap();

    //used for animating markers and populating window
    //when clicking on links in search bar
    this.bounceMarker = function() {
        if(currentInfoWindow){
            currentInfoWindow.close();
        }
        currentInfoWindow = new google.maps.InfoWindow();
        populateInfoWindow(this, currentInfoWindow);
        this.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout((function() {
            this.setAnimation(null);
        }).bind(this), 1400);
    };

    // This function populates the infowindow when the marker is clicked.
    function populateInfoWindow(marker, infowindow) {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout((function() {
            marker.setAnimation(null);
        }).bind(this), 1400);
        if (infowindow.marker != marker) {
            infowindow.marker = marker;
            infowindow.setContent('');

            //Used for querying foursquare to receive info about a restaurant by id
            var clientId = "C13XY3P0FOZHVRMH4P012BAQEVJWJ5B1DKKWABGH4NPSJGJ1";
            var clientSecret = "32EAQ3UVACIPRVL4QLN0FTNOBMZFBJ0ZUMCLERDNNDIEHZWP";
            var apiUrl = 'https://api.foursquare.com/v2/venues/' +
                    marker.id + '?client_id=' + clientId +
                    '&client_secret=' + clientSecret + '&query=' + marker.title +
                    '&v=20180323';
            $.getJSON(apiUrl).done(function(marker) {
                self.street = marker.response.venue.location.formattedAddress[0];
                self.city = marker.response.venue.location.formattedAddress[1];
                self.category = marker.response.venue.categories[0].shortName;
                self.phone = marker.response.venue.contact.formattedPhone;
                self.price = marker.response.venue.price.message;

                //creates html content for window
                self.htmlContentFoursquare =
                    '<h5 class="iw_subtitle">(' + self.category +
                    ')</h5>' + '<div>' +
                    '<h6 class="iw_address_title"> Address: </h6>' +
                    '<p class="iw_address">' + self.street + '</p>' +
                    '<p class="iw_address">' + self.city + '</p>' +
                    '<p class="iw_address">' + "Phone: " + self.phone + '</p>' +
                    '<p class="iw_address">' + "Price: " + self.price + '</p>' +
                    '</p>' + '</div>' + '</div>';

                infowindow.setContent(self.htmlContent + self.htmlContentFoursquare);
            }).fail(function() {
                // Send alert if foursqure is unavailable
                alert(
                    "There was an issue loading the Foursquare API. Please refresh your page to try again."
                );
            });
            self.htmlContent = '<div>' + '<h4 class="iw_title">' + marker.title +
                    '</h4>';

            infowindow.open(map, marker);
        }
        // Make sure the marker property is cleared if the infowindow is closed.
        infowindow.addListener('closeclick', function() {
            currentInfoWindow.close();
            infowindow.marker = null;
        });

    }

    // This function takes in a COLOR, and then creates a new marker
    function makeMarkerIcon(markerColor) {
        var markerImage = new google.maps.MarkerImage(
          'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
          '|40|_|%E2%80%A2',
          new google.maps.Size(21, 34),
          new google.maps.Point(0, 0),
          new google.maps.Point(10, 34),
          new google.maps.Size(21,34));
        return markerImage;
    }

    //creates a location marker using locations.js
    function LocationMarker(data) {
        var self = this;
        // Style the markers a bit. This will be our listing marker icon.
        var defaultIcon = makeMarkerIcon('807d6f');
        // Create a "highlighted location" marker color for when the user
        // mouses over the marker.
        var highlightedIcon = makeMarkerIcon('ded7bd');
        this.lat = data.lat;
        this.lng = data.lng;
        this.title = data.title;
        this.id = data.id;
        // Create a marker per location, and put into markers array.
        var marker = new google.maps.Marker({
            position: {
                lat: this.lat,
                lng: this.lng
            },
            id: this.id,
            title: this.title,
            animation: google.maps.Animation.DROP,
            icon: defaultIcon,
        });
        // Push the marker to our array of markers.
        markers.push(marker);
        marker.setMap(map);
        // Create an onclick event to open the large infowindow at each marker.
        marker.addListener('click', function() {
            if (currentInfoWindow){
                currentInfoWindow.close();
            }
            currentInfoWindow = new google.maps.InfoWindow();
            populateInfoWindow(this, currentInfoWindow);
        });
        // Two event listeners - one for mouseover, one for mouseout,
        // to change the colors back and forth.
        marker.addListener('mouseover', function() {
            this.setIcon(highlightedIcon);
        });
        marker.addListener('mouseout', function() {
            this.setIcon(defaultIcon);
        });
    }

    //add locations to a list and allows you to search through them
    this.myLocationsFilter = ko.computed(function() {
        var result = [];
        for (var i = 0; i < markers.length; i++) {
            var markerLocation = markers[i];
            if (markerLocation.title.toLowerCase().startsWith(this.searchOption()
                    .toLowerCase())) {
                result.push(markerLocation);
                markers[i].setVisible(true);
            } else {
                markers[i].setVisible(false);
            }
        }
        return result;
    }, this);


}

//starts app using knockout
function startApp() {
    ko.applyBindings(new ViewModel());
}

myerrorhandler = function googleError() {
    alert(
        'Google maps did not load correctly. Please refresh your page and try again.'
    );
};

