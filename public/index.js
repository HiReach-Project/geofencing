// https://maps.openrouteservice.org/directions?n1=44.434245&n2=26.122235&n3=15&a=44.431298,26.104417,44.438131,26.139951&b=0&c=0&k1=en-US&k2=km

const registerSw = async () => {
    window.registration = await navigator.serviceWorker.register('/service-worker.js');
    await registration.update();
};

if (('serviceWorker' in navigator)) {
    registerSw().then();
}

const initGeofence = async () => {
    const payload = {
        "id": 1,
        "fence": {
            "area": routeLatLngs,
            "customAreas": [
                { "name": "Green Dot", "position": [44.430064, 26.10697] }
            ],
            "timetableCustomAreas": [
                { "name": "Orange Dot", "position": [44.430735, 26.110162], "time": 1600167600000, "error": 10 },
                { "name": "Blue Dot", "position": [44.430432, 26.115065], "time": 1600142400000, "error": 10 }
            ]
        },
        "customConfig": {
            "timeTableErrorMinutes": 10,
            "offFenceAreaNotificationIntervalMinutes": 1,
            "fenceNearbyRetry": 3,
            "fenceAreaBorderMeters": 30,
            "fenceAreaBetweenPointsMeters": 15,
            "customAreaRadiusMeters": 15,
            "notifyMessageLanguage": "en",
            "targetName": "John Doe",
            "sameLocationTime": 1,
            "notifyFenceStartedStatus": true,
            "notifyReachedDestinationStatus": true,
            "notifyLateArrivalStatus": true,
            "notifyEarlyArrivalStatus": true,
            "notifySameLocationStatus": true
        },
        "isFencingOn": true
    };

    payload.isFencingOn = false;

    await fetch(`/target`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    payload.isFencingOn = true;

    await fetch(`/target`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
};

const requestPutTarget = async (payload) => {
    await fetch(`/target`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
};

const blueAreaNoArrival = async () => {
    targetCircle.setLatLng([44.430506, 26.10648]);
    const payload = {
        "id": 1,
        "position": [44.430506, 26.10648]
    };
    await requestPutTarget(payload);
};

const greenAreaArrival = async () => {
    targetCircle.setLatLng([44.430064, 26.10697]);
    const payload = {
        "id": 1,
        "position": [44.430064, 26.10697]
    };

    await requestPutTarget(payload);
};

const orangeAreaEarlyArrival = async () => {
    targetCircle.setLatLng([44.430735, 26.110162]);
    const payload = {
        "id": 1,
        "position": [44.430735, 26.110162]
    };

    await requestPutTarget(payload);
};

const blueAreaLateArrival = async () => {
    targetCircle.setLatLng([44.430432, 26.115065]);
    const payload = {
        "id": 1,
        "position": [44.430432, 26.115065]
    };

    await requestPutTarget(payload);
};

const purpleAreaOffRoad = async () => {
    targetCircle.setLatLng([44.431068, 26.11948]);
    const payload = {
        "id": 1,
        "position": [44.431068, 26.11948]
    };

    await requestPutTarget(payload);
};

const redAreaSameSpot = async () => {
    targetCircle.setLatLng([44.430382, 26.120628]);
    const payload = {
        "id": 1,
        "position": [44.430382, 26.120628]
    };

    await requestPutTarget(payload);
};

const endAreaReachedDestination = async () => {
    targetCircle.setLatLng([44.438187, 26.139999]);
    const payload = {
        "id": 1,
        "position": [44.438187, 26.139999]
    };

    await requestPutTarget(payload);
};


const urlBase64ToUint8Array = base64String => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

const subscribeAndAddSupervisor = async () => {
    if (!('PushManager' in window) || !registration) {
        return;
    }

    const permission = await Notification.requestPermission();

    if (permission !== 'granted') return;

    // subscribe user
    const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array("BDLemtuPfbg6viIoGSgzkkeB211dtacOjHaVCqKEJL88qMuY3mnx44eVCPNYp5Wd54EdbYS8YIhBjPABuRkZvSE")
    };

    const subscription = await registration.pushManager.subscribe(subscribeOptions);

    await fetch('/supervisor', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "id": 1,
            "subscription": {
                "webPush": subscription,
            }
        })
    });

    await fetch('/target/supervisor', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "targetId": 1,
            "supervisorId": 1
        })
    });
};

const unsubscribe = async () => {
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    const sub = await registration.pushManager.getSubscription();
    try {
        await sub.unsubscribe();
    } catch (e) {
        console.log("Error on unsubscribe >> ", e);
    }
};
const routeLatLngs = [[44.430755, 26.10621],
    [44.430656, 26.10632],
    [44.43055, 26.106442],
    [44.430231, 26.106819],
    [44.430087, 26.106988],
    [44.430159, 26.107157],
    [44.430231, 26.107308],
    [44.430525, 26.10792],
    [44.430649, 26.108179],
    [44.430785, 26.108462],
    [44.430911, 26.108725],
    [44.431062, 26.109042],
    [44.431272, 26.109472],
    [44.431339, 26.109607],
    [44.4312, 26.109747],
    [44.431041, 26.109912],
    [44.43085, 26.110109],
    [44.430764, 26.110229],
    [44.430729, 26.110331],
    [44.43072, 26.110385],
    [44.430704, 26.110709],
    [44.4307, 26.110786],
    [44.430677, 26.111249],
    [44.430669, 26.111406],
    [44.430659, 26.111561],
    [44.430658, 26.111577],
    [44.430604, 26.112112],
    [44.430547, 26.112812],
    [44.430531, 26.113298],
    [44.430511, 26.113805],
    [44.430483, 26.114369],
    [44.430473, 26.114661],
    [44.430472, 26.114946],
    [44.430474, 26.115011],
    [44.430513, 26.115986],
    [44.430426, 26.11675],
    [44.430446, 26.117164],
    [44.430472, 26.117286],
    [44.430498, 26.117478],
    [44.430479, 26.118138],
    [44.430419, 26.119967],
    [44.430412, 26.120182],
    [44.43041, 26.120335],
    [44.43041, 26.120437],
    [44.430413, 26.120601],
    [44.430441, 26.121517],
    [44.43049, 26.123045],
    [44.430516, 26.123753],
    [44.430517, 26.123906],
    [44.43053, 26.124792],
    [44.430535, 26.124922],
    [44.430554, 26.125988],
    [44.43056, 26.1261],
    [44.430576, 26.126263],
    [44.430637, 26.126732],
    [44.430672, 26.127005],
    [44.43076, 26.127665],
    [44.430872, 26.128508],
    [44.430941, 26.129031],
    [44.431043, 26.12981],
    [44.431059, 26.129924],
    [44.431073, 26.130035],
    [44.431371, 26.132293],
    [44.431404, 26.132541],
    [44.431506, 26.132538],
    [44.431872, 26.132526],
    [44.431959, 26.132518],
    [44.432268, 26.13248],
    [44.432585, 26.132435],
    [44.433249, 26.132323],
    [44.433828, 26.132285],
    [44.434584, 26.132813],
    [44.434654, 26.132862],
    [44.434756, 26.132841],
    [44.43608, 26.132577],
    [44.436273, 26.13254],
    [44.437278, 26.132349],
    [44.437341, 26.132335],
    [44.437344, 26.132423],
    [44.43738, 26.132963],
    [44.437395, 26.133203],
    [44.437408, 26.133701],
    [44.437422, 26.134071],
    [44.437446, 26.134515],
    [44.437457, 26.134815],
    [44.437466, 26.135043],
    [44.437418, 26.135202],
    [44.437393, 26.135356],
    [44.437387, 26.135582],
    [44.437384, 26.135708],
    [44.437424, 26.136018],
    [44.437435, 26.136085],
    [44.437465, 26.136256],
    [44.4375, 26.136387],
    [44.437532, 26.136533],
    [44.43758, 26.136713],
    [44.437649, 26.136986],
    [44.43776, 26.137412],
    [44.437963, 26.13819],
    [44.438089, 26.138677],
    [44.438179, 26.139021],
    [44.438217, 26.139169],
    [44.438403, 26.139884],
    [44.438187, 26.139999],
    [44.438169, 26.139931]]
// initialize map
let map = L.map('mapid').setView([44.432283, 26.104162], 15);
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18
}).addTo(map);
// add route to map
let path = L.polyline(routeLatLngs,{}).addTo(map);
map.addLayer(path);
// center map to fit the route
map.fitBounds(path.getBounds());
// create colored marker icons
let greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
let redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
// add start/end markers with custom icons
let markerStart = L.marker([44.430755, 26.10621], {icon: greenIcon}).addTo(map);
markerStart.bindPopup('Starting point');
let markerEnd = L.marker([44.438169, 26.139931], {icon: redIcon}).addTo(map);
markerEnd.bindPopup('End');
// add areas
// green area
let greenCircle = L.circle([44.430064, 26.10697], {
    color: 'green',
    fillColor: 'green',
    fillOpacity: 1,
    radius: 20
}).addTo(map)
// orange area
let orangeCircle = L.circle([44.430735, 26.110162], {
    color: 'orange',
    fillColor: 'orange',
    fillOpacity: 1,
    radius: 20
}).addTo(map)
// blue area
let blueCircle = L.circle([44.430432, 26.115065], {
    color: 'blue',
    fillColor: 'blue',
    fillOpacity: 1,
    radius: 20
}).addTo(map)
// purple area
let purpleCircle = L.circle([44.431068, 26.11948], {
    color: 'purple',
    fillColor: 'purple',
    fillOpacity: 1,
    radius: 20
}).addTo(map)
// red area
let redCircle = L.circle([44.430382, 26.120628], {
    color: 'red',
    fillColor: 'red',
    fillOpacity: 1,
    radius: 20
}).addTo(map);
// add target circle
let targetCircle = L.circle([44.430755, 26.10621], {
    color: '#03fcf4',
    fillColor: '#03fcf4',
    fillOpacity: 1,
    radius: 10
}).addTo(map);
targetCircle.bindPopup('John Doe');