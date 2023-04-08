const apiUrl = 'https://rhfellowship-locator.onrender.com/api/v1/locate';
const indexHtmlBody = document.querySelector("body");
const resultsDiv = document.getElementById("output");
const errorDiv = document.getElementById("error-output");
const messageBox = document.querySelectorAll('.message');

let checkError = false;
let userLatitude, userLongitude, userLocationMarker,nearestFellowshipMarker, fellowshipPath;

// leaflet map display
// function initMap(lat1, lon1, lat2, lon2, minName) {
//     // create lealet map center
//     const map = L.map('map').setView([lat1, lon1], 13);

//     // Add a tile layer to the map (e.g. OpenStreetMap)
//     L.tileLayer('https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=uhW0Bs1Sz7K9YSK9BLWJ', {
//         attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
//     }).addTo(map);

//     // Add a marker for the user's location
//     userLocationMarker = L.marker([lat1, lon1]).addTo(map);
//     userLocationMarker.bindPopup("Your location");

//     // Add a marker for the nearest store
//     nearestFellowshipMarker = L.marker([lat2, lon2]).addTo(map);
//     nearestFellowshipMarker.bindPopup(minName);

//     // Add a path from the user's location to the nearest store
//     fellowshipPath = L.polyline([[lat1, lon1], [lat2, lon2]], {color: 'red'}).addTo(map);

//     // Fit the map bounds to show both markers and the path
//     map.fitBounds([userLocationMarker.getLatLng(), nearestFellowshipMarker.getLatLng()]);
// }

// show iput box icon
function showIcon(icon) {
    // clear icons in form
    document.querySelector('.icon-remove').style.display = 'none';
    document.querySelector('.icon-check').style.display = 'none';

    // show correct icon based on input
    document.querySelector(`.icon-${icon}`).style.display = 'inline-flex';
};

// listen for delete location click
function deleteLocation(e) {
    if(e.target.className == 'delete delLocation') {
        console.log('123');
        const messageBox = e.target.parentNode.parentNode;
        messageBox.remove();
    }
}

async function findNearestFellowship(userLocation) {
  
    // TODO: Use geolocation API or geocoding service to get
    // localhost = http://localhost:5000/api/v1/locate/userinput
  
    await fetch(`${apiUrl}/userinput`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ address: userLocation })
      })
      .then(response => {
        // invalid user input
        if(response.status !== 200) {
            showIcon('remove');
            errorDiv.innerHTML = `
            <article class="message is-danger">
                <div class="message-header">
                    <p>Invalid! Please enter a valid address</p>
                </div>
            </article>
            `;
            checkError = true;
            throw Error(response.statusText);
        }
        else {
            showIcon('check');
            errorDiv.innerHTML = "";
            return response.json();
        }
      })
      .then(data => {
        userLatitude = data.data.userLat;
        userLongitude = data.data.userLong;
      })
      .catch(error => {
        console.error('Error:', error);
      });

    // if checkerror = true
    if (checkError) {
        checkError = false;
        return
    }
    // Loop through each store location and calculate the distance from the user's location
    // const res = await fetch('http://localhost:5000/api/v1/locate');
    const res = await fetch(apiUrl);
    const {data} = await res.json();
    console.log(data);
    const fellowships = data;

    // inialize map
    // initMap(userLatitude, userLongitude, fellowships[0].location.coordinates[1], fellowships[0].location.coordinates[0], fellowships[0].fullName);
    let results = [];
    for (var i = 0; i < fellowships.length; i++) {
      let fellowship = fellowships[i];
      let fellowshipLong = fellowship.location.coordinates[0];
      let fellowshipLat = fellowship.location.coordinates[1];

      let distance = calculateDistance(userLatitude, userLongitude, fellowshipLat, fellowshipLong);
      results.push({ name: fellowship.fullName, address: fellowship.address, phone: fellowship.phoneNumber, attendance: fellowship.attendanceMode, distance: distance, fellowshipLong, fellowshipLat, userLatitude, userLongitude});
    }
  
    // Sort the list of stores by distance
    results.sort(function(a, b) {
      return a.distance - b.distance;
    });
  
    // Display the list of stores to the user
    resultsDiv.innerHTML = `
        <h4 class="subtitle is-4">House Fellowship Near-By</h4>
    `;

    for (var i = 0; i < 3; i++) {
        var house = results[i];
        resultsDiv.innerHTML += `
        <article class="message is-primary">
            <div class="message-header">
                <p>${house.distance}km away</p>
                <button class="delete delLocation" aria-label="delete"></button>
            </div>
            <div class="message-body">
                <ul>
                    <li><strong>Name: </strong>${house.name}</li>
                    <li><strong>Address: </strong>${house.address}</li>
                    <li><strong>Phone: </strong>${house.phone}</li>
                    <li><strong>Mode: </strong>${house.attendance}</li>
                </ul>
            </div>
        </article>
        `;
    }
    // checkError = false;
    // setTimeout(errorDiv.innerHTML="", 3000);
}
  
function calculateDistance(lat1, lon1, lat2, lon2) {
    // TODO: Implement Haversine formula to calculate distance between two latitude/longitude points

    // Convert latitude and longitude to radians
    var radLat1 = Math.PI * lat1 / 180;
    var radLon1 = Math.PI * lon1 / 180;
    var radLat2 = Math.PI * lat2 / 180;
    var radLon2 = Math.PI * lon2 / 180;
    
    // Calculate the distance between the two points using the Haversine formula
    var dLat = radLat2 - radLat1;
    var dLon = radLon2 - radLon1;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(radLat1) * Math.cos(radLat2) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var distance = 6371 * c; // Multiply by the radius of the Earth in km to get distance in km
    
    // Convert distance to miles
    // distance = distance * 0.621371;
    
    return distance.toFixed(2); // Round to 2 decimal places

}

const form = document.querySelector('#zipForm');
form.addEventListener('submit', async(event) => {
  event.preventDefault();
  const userLocation = document.querySelector('.zip').value;
  console.log(userLocation);

  findNearestFellowship(userLocation);
});
indexHtmlBody.addEventListener('click', deleteLocation);


