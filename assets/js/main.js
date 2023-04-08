import L from '../../node_modules/leaflet/dist/leaflet.js';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet.markercluster';

let latitude = null;
let longitude = null;
let address;
let source;

const apps = ['.home', '.app1'];

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
            resolve({address,source});
        } catch (error) {
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
                resolve({address,source});
            } catch (error) {
                reject("Une erreur est survenue lors de la récupération de la position.");
            }
        }
    });
}

async function createMapWidget() {
    try {
        var map = L.map('map', {
            zoomControl: false
        }).setView([latitude, longitude], 13);
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
        map.dragging.disable();
    } catch (error) {
        console.error(error);
    }
}

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
        $(app).hide();
    });
    $(".home-content").css({
        transform: "scale(3)",
        opacity: "0",
    });
    $(".fixed-bar").css({
        opacity: "0",
    });
    $(app).show();
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
    const introVideo = document.getElementById("intro-video");
    //introVideo.play();

    introVideo.addEventListener("ended", function () {
        introVideo.remove();

        launchHome();

        getCurrentPosition().then(() => {
            createMapWidget();
            createWeatherWidget();
        }).catch(error => {
            console.error(error);
        });
    
        $(".app-icon").click(function() {
            launchApp('.app1');
        });
        $(".app1").click(function() {
            launchHome();
        });
        
    });
});