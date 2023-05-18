import L from '../../node_modules/leaflet/dist/leaflet.js';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet.markercluster';

let location;

let locationGranted = false;

let maps = { 'map': null, 'map1': null }

var player;

const apps = ['.welcome', '#intro-video', '.home', '.maps', '.tiktok', '.siri', '.google', '.nordvpn'];
const welcomeBtn = document.getElementById("welcome-start");
const backHomeBtn = $("#back-home-btn");

async function getLocation() {
    return new Promise(async (resolve, reject) => {
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            const { latitude, longitude } = position.coords;
            const browserAddress = await getAddress(latitude, longitude);
            const ipAddress = await getIpAddress();
            location = {
                browserLocation: {
                    latitude,
                    longitude,
                    address: browserAddress.address,
                    city: browserAddress.city,
                },
                ipLocation: {
                    latitude: ipAddress.latitude,
                    longitude: ipAddress.longitude,
                    address: ipAddress.address,
                    city: ipAddress.city,
                }
            };
            resolve(location);
            locationGranted = true;
        } catch (error) {
            alert('Pour le bon déroulement du Webdoc, veuillez activer la localisation de votre navigateur.');
            reject("Une erreur est survenue lors de la récupération de la position.");
        }
    });
}

async function getAddress(latitude, longitude) {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
    const addressData = await response.json();
    const city = addressData.address.town || addressData.address.city || addressData.address.village || "Unknown";
    const address = `${addressData.address.road}, ${city}, ${addressData.address.state}, ${addressData.address.country}`;
    return { address, city };
}

async function getIpAddress() {
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();
    const latitude = data.latitude;
    const longitude = data.longitude;
    const city = data.city;
    const address = `${data.city}, ${data.region}, ${data.country}`;
    return { latitude, longitude, city, address };
}

async function createMap(mapId) {
    try {
        if (mapId == 'map') {
            var map = L.map(mapId, {
                zoomControl: false
            }).setView([location.browserLocation.latitude, location.browserLocation.longitude], 13);
        } else {
            var map = L.map(mapId).setView([location.browserLocation.latitude, location.browserLocation.longitude], 13);
        }
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        map.attributionControl.setPrefix('');

        if (mapId == 'map1') {
            map.zoomControl.setPosition('topleft');
            L.control.scale().addTo(map);
        } else {
            map.dragging.disable();
            map.touchZoom.disable();
            map.doubleClickZoom.disable();
            map.scrollWheelZoom.disable();
            map.boxZoom.disable();
            map.keyboard.disable();
        }

        changeMarkerLocation(map,"browser");
        maps[mapId] = map;
    } catch (error) {
        console.error(error);
    }
}

function changeMarkerLocation(map, locationType) {
    var locationData = locationType === "ip" ? location.ipLocation : location.browserLocation;
    var newLatLng = [locationData.latitude, locationData.longitude];

    // rm old marker
    map.eachLayer(function (layer) {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });

    // add new marker
    map.panTo(newLatLng);
    var marker = L.marker(newLatLng, {
        icon: L.icon({
            iconUrl: './dist/img/marker-icon.png',
            iconSize: [50, 50],
            iconAnchor: [25, 50],
            popupAnchor: [1, -50],
        })
    }).addTo(map);
    marker.bindPopup("<b>Votre localisation " + (locationType === "ip" ? "IP" : "GPS") + " (approximative) : <br>" + locationData.address + "</b>", { autoClose: false, closeButton: false, closeOnClick: false }).openPopup();
}

async function createWeatherWidget() {
    try {
        const apiKey = "70cd7ed3d8d342bea42ea9eb0efda8c9";
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${location.browserLocation.latitude}&lon=${location.browserLocation.longitude}&units=metric` + `&appid=${apiKey}`);
        const data = await response.json();

        $(".widget-weather .city").html(location.browserLocation.city);
        $(".widget-weather .temperature").html(`${Math.round(data.main.temp)}°`);
    } catch (error) {
        console.error(error);
        $(".widget-weather .city").text("N/A");
        $(".widget-weather .temperature").text("?°");
    }
}

function updateTimeWidget() {
    let date = new Date(),
        secToDeg = (date.getSeconds() / 60) * 360,
        minToDeg = (date.getMinutes() / 60) * 360,
        hrToDeg = (date.getHours() / 12) * 360;

    $(".second").css("transform", `rotate(${secToDeg}deg)`);
    $(".minute").css("transform", `rotate(${minToDeg}deg)`);
    $(".hour").css("transform", `rotate(${hrToDeg}deg)`);
}

function getDateTime() {
    const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    const months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
    const date = new Date();
    const dayWeek = days[date.getDay()];
    const dayMonth = date.getDate();
    const monthYear = months[date.getMonth()];
    const hour = date.getHours();
    const mins = date.getMinutes();
    return [`${dayWeek} ${dayMonth} ${monthYear}`, `${hour}:${mins < 10 ? "0" + mins : mins}`];
}
  
async function launchApp(app) {
    apps.forEach(app => {
        $(".app" + app).hide();
    });
    $(".home-content").css({
        transform: "scale(3)",
        opacity: "0",
    });
    $(".fixed-bar").css({
        opacity: "0",
    });
    if (['.welcome', '#intro-video', '.intro-video', '.home'].includes(app)) {
        $(backHomeBtn).css({
            bottom: "5px",
            opacity: "0",
        });
        setTimeout(() => {
            $(backHomeBtn).hide();
        }, 300);
    } else {
        $(backHomeBtn).show();
        $(backHomeBtn).css({
            bottom: "20px",
            opacity: "1",
        });
    }
    $(app).show();
    switch (app) {
        case '.home':
            $(".home-content").css({
                transform: "scale(1)",
                opacity: "1",
            });
            $(".fixed-bar").css({
                opacity: "1",
            });
            break;
        case '.welcome':
            console.log('ok');
            var date = getDateTime();
            console.log(date)
            $('.date').html(date[0]);
            $('.time').html(date[1]);
            setInterval(() => {
                var date = getDateTime();
                $('.date').html(date[0]);
                $('.time').html(date[1]);
            }, 1000);
            break;
        case '.intro-video':
            player.seekTo(0);
            player.playVideo();
            break;
        case '.maps':
            if (!maps['map1']) {
                createMap('map1');
            }
            $('input#gps').on('change', function () {
                if (this.checked) {
                    $('input#ip').prop('checked', false);
                    changeMarkerLocation(maps['map1'], "browser");
                } else {
                    $('input#ip').prop('checked', true);
                    changeMarkerLocation(maps['map1'], "ip");
                }
            });
            $('input#ip').on('change', function () {
                if (this.checked) {
                    $('input#gps').prop('checked', false);
                    changeMarkerLocation(maps['map1'], "ip");
                } else {
                    $('input#gps').prop('checked', true);
                    changeMarkerLocation(maps['map1'], "browser");
                }
            });
            break;
        case '.siri':
            if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
                const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

                recognition.lang = 'fr-FR';

                recognition.onstart = function () {
                    console.log("La reconnaissance vocale a démarré.");
                }

                recognition.onresult = function (event) {
                    const result = event.results[0][0].transcript;
                    console.log("Vous avez dit : " + result);
                }

                recognition.onerror = function (event) {
                    console.error("Erreur de reconnaissance vocale : " + event.error);
                }

                recognition.onend = function () {
                    console.log("La reconnaissance vocale s'est terminée.");
                }

                recognition.start();

            } else {
                alert("La reconnaissance vocale n'est pas supportée sur ce navigateur.");
            }
    }
}

// Intro youtube
window.onYouTubeIframeAPIReady = function () {
    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        videoId: "ZuiS7hwKFRc",
        playerVars: {
            'controls': 0
        },
        events: {
            //'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

// function onPlayerReady() {
//     console.log('ready');
// }

var initialized = false;
function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.ENDED) {
        launchApp('.home');
        if (!initialized) {
            createMap('map');
            createWeatherWidget();
            setInterval(updateTimeWidget, 1000);
            updateTimeWidget();
            initialized = true;
        }
    }
}

$(document).ready(function () {
    // bloquer clic droit
    $(document).bind("contextmenu", function (e) {
        e.preventDefault();
    });

    // launch loader + app
    launchApp('.welcome');
    
    $(window).on('load', function () {
        $('.preloader .loader').fadeOut();
        $('.preloader').animate({
            bottom: '100%',
            opacity: '0'
        }, 1000);
        setTimeout(function () {
            $('.preloader').hide();
        }, 1000);

        getLocation();

        welcomeBtn.addEventListener("click", function () {
            if (locationGranted) {
                // Lancement prmeière fois de intro qui se charge d'initialiser home et widgets
                launchApp('.intro-video');

                $(".app-icon:not(.inactive,.link)").on('click', function () {
                    launchApp("." + $(this).attr('class').replace('app-icon ', ''));
                });

                $(".widget.widget-map").on('click', function () {
                    launchApp(".maps");
                });

                $(backHomeBtn).on('click', function () {
                    launchApp('.home');
                });
            } else {
                alert('Pour commencer, veuillez autoriser l\'accès à la géolocalisation sur votre navigateur.');
            }
        });
    });
});