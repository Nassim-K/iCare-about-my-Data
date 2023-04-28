import L from '../../node_modules/leaflet/dist/leaflet.js';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet.markercluster';

let latitude = null;
let longitude = null;
let address;
let source;

const apps = ['.welcome', '#intro-video', '.home', '.maps'];
const introVideo = document.getElementById("intro-video");
const welcomeBtn = document.getElementById("welcome-start");
const backHomeBtn = $(".back-home-btn");

async function getCurrentPosition() {
    return new Promise(async (resolve, reject) => {
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
            source = "browser";
            const addressResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const addressData = await addressResponse.json();
            const city = addressData.address.town || addressData.address.city || addressData.address.village || "Unknown";
            address = `${addressData.address.road}, ${city}, ${addressData.address.state}, ${addressData.address.country}`;
            resolve({
                address,
                source
            });
        } catch (error) {
            alert("Pour le bon déroulement du Webdoc, veuillez activer la localisation dans votre navigateur.");
            try {
                const response = await fetch("https://ipapi.co/json/");
                const data = await response.json();
                source = "ip";
                latitude = data.latitude;
                longitude = data.longitude;
                const addressResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                const addressData = await addressResponse.json();
                const city = addressData.address.town || addressData.address.city || addressData.address.village || "Unknown";
                address = `${addressData.address.road}, ${city}, ${addressData.address.state}, ${addressData.address.country}`;
                resolve({
                    address,
                    source
                });
            } catch (error) {
                reject("Une erreur est survenue lors de la récupération de la position.");
            }
        }
    });
}

async function createMap(mapId) {
    try {
        if (mapId == 'map') {
            var map = L.map(mapId, {
                zoomControl: false
            }).setView([latitude, longitude], 13);
        } else {
            var map = L.map(mapId).setView([latitude, longitude], 13);
        }
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        map.attributionControl.setPrefix('');
        var newIcon = L.icon({
            iconUrl: '/dist/img/marker-icon.png',
            iconSize: [50, 50],
            iconAnchor: [25, 50],
            popupAnchor: [1, -50],
        });
        var marker = L.marker([latitude, longitude], {
            icon: newIcon
        }).addTo(map);
        marker.bindPopup("<b>Votre localisation " + (source === "ip" ? "IP" : "navigateur") + " : <br>" + address + "</b>").openPopup();
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
    } catch (error) {
        console.error(error);
    }
}

// todo
async function createWeatherWidget() {
    try {
        const apiKey = "70cd7ed3d8d342bea42ea9eb0efda8c9";
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric` + `&appid=${apiKey}`);
        const data = await response.json();
        console.log(`Météo à ${address} :`);
        console.log(`Température : ${data.main.temp}°C`);
        console.log(`Humidité : ${data.main.humidity}%`);
        console.log(`Vitesse du vent : ${data.wind.speed}m/s`);
        console.log(`Description : ${data.weather[0].description}`);
    } catch (error) {
        console.error(error);
    }
}

function launchApp(app) {
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
    if (['.welcome', '#intro-video', '.home'].includes(app)) {
        $(backHomeBtn).addClass('hidden'); // TODO ne fonctionne pas :(
    } else {
        $(backHomeBtn).removeClass('hidden');
    }
    Particles.init({
        selector: '.background',
        maxParticles: 0,
    })
    $(app).show();
    switch (app) {
        case '.welcome':
            Particles.init({
                selector: '.background',
                maxParticles: 250,
                connectParticles: true,
                speed: .15,
                minDistance: 140,
                sizeVariations: 4,
                color: '#ffffff',
            });
            break;
        case '.intro-video':
            introVideo.play();
            introVideo.addEventListener("ended", function () {
                launchHome();
            });
            break;
        case '.maps':
            createMap('map1');
            break;
    }
}

function launchHome() {
    launchApp('.home');
    $(".home-content").css({
        transform: "scale(1)",
        opacity: "1",
    });
    $(".fixed-bar").css({
        opacity: "1",
    });
}

$(document).ready(function () {

    /*if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = 'fr-FR';
        
        recognition.onstart = function() {
          console.log("La reconnaissance vocale a démarré.");
        }
        
        recognition.onresult = function(event) {
          const result = event.results[0][0].transcript;
          console.log("Vous avez dit : " + result);
        }
        
        recognition.onerror = function(event) {
          console.error("Erreur de reconnaissance vocale : " + event.error);
        }
        
        recognition.onend = function() {
          console.log("La reconnaissance vocale s'est terminée.");
        }
        
        //const startButton = document.getElementById("start-button");
        
        //welcomeBtn.addEventListener("click", function() {
          recognition.start();
        //});
        
      } else {
        console.error("La reconnaissance vocale n'est pas supportée sur ce navigateur.");
      } */

    launchApp('.welcome');
    getCurrentPosition();

    welcomeBtn.addEventListener("click", function () {
        launchApp('#intro-video');
        introVideo.play();

        introVideo.addEventListener("ended", function () {
            launchHome();

            // laisser la puisque je le fais qu'une fois au lancement
            createMap('map');
            createWeatherWidget();

            $(".app-icon").on('click', function () {
                launchApp("." + $(this).attr('class').replace('app-icon ', ''));

            });
            /*$(".app1").on('click', function () {
                launchHome();
            });*/
        });
    });

});