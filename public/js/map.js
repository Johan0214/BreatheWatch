document.addEventListener("DOMContentLoaded", () => {
  const mapDiv = document.getElementById("pollution-map");

  if (!mapDiv) {
    return;
  }

  let geojsonLayer = null;

  const map = L.map("pollution-map").setView([40.7128, -74.006], 11);

  // Adding OpenStreetMap tiles
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);


  const getColor = (score) => {
    if (score === "High") {
      return "#e63946";
    }
    if (score === "Moderate") {
      return "#ffb703";
    } 
    if (score === "Safe"){
      return "#2a9d8f"
    }

    return "#adb5bd";
  };

  //Highlighting effect when hoverning a neighborhood
  const highlightFeature = (e) => {
    const layer = e.target;
    layer.setStyle({
      weight: 3,
      color: "#333",
      fillOpacity: 0.8,
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      layer.bringToFront();
    }
  };

  // Reset highlight when mouse leaves polygon
  const resetHighlight = (e) => {
    geojsonLayer.resetStyle(e.target);
  };

  const onEachFeature = (feature, layer) => {
  const name =
      feature.properties.ntaname || 
      feature.properties.neighborhood || 
      feature.properties.name || 
      "Unknown Area";
  const score = feature.properties.pollutionScore;

  if (feature.properties.airQuality) {
    const aq = feature.properties.airQuality;
    layer.bindPopup(`
      <b>${name}</b><br/>
      <hr style="margin: 5px 0">
      <strong>Air Quality:</strong> ${score}<br/>
      PM2.5: ${aq.pollutants.PM2_5}<br/>
      NO₂: ${aq.pollutants.NO2}
    `);
  } else {
    layer.bindPopup(`
      <b>${name}</b><br/>
      Air Quality: Not available
    `);
  }

  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
  });
};

  // ---------------------------------------------------------
  // FETCH & RENDER NEIGHBORHOOD GEOMETRIES
  // ---------------------------------------------------------

  fetch("/reports/airquality/map-data")
  .then((res) => res.json())
  .then((data) => {
    geojsonLayer = L.geoJSON(data, {
      style: (feature) => ({
        fillColor: getColor(feature.properties.pollutionScore),
        weight: 1,
        color: "#333",
        fillOpacity: 0.6,
      }),
      onEachFeature,
    }).addTo(map);
  })
  .catch((err) => {
    console.error("Failed to load map data:", err);
  });

});
