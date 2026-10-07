// Browser Geolocation API Helper Module

function initGeolocation() {
  const btnGeo = document.getElementById('btnGetGeoLocation');
  const latInput = document.getElementById('latitude');
  const lngInput = document.getElementById('longitude');
  const geoStatus = document.getElementById('geoStatus');
  const locationInput = document.getElementById('location');

  if (!btnGeo) return;

  btnGeo.addEventListener('click', () => {
    if (!navigator.geolocation) {
      if (geoStatus) {
        geoStatus.className = 'text-danger small mt-1';
        geoStatus.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-1"></i>Geolocation is not supported by your browser.';
      }
      return;
    }

    if (geoStatus) {
      geoStatus.className = 'text-primary small mt-1';
      geoStatus.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Acquiring GPS location... Please allow location access.';
    }

    btnGeo.disabled = true;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);

        if (latInput) latInput.value = lat;
        if (lngInput) lngInput.value = lng;

        if (geoStatus) {
          geoStatus.className = 'text-success small mt-1 font-monospace';
          geoStatus.innerHTML = `
            <i class="bi bi-geo-alt-fill me-1"></i>Location captured! Lat: <strong>${lat}</strong>, Lng: <strong>${lng}</strong> 
            <a href="https://maps.google.com/?q=${lat},${lng}" target="_blank" class="ms-2 text-decoration-underline text-success">View on Google Maps</a>
          `;
        }

        // Pre-append GPS note to location if empty
        if (locationInput && !locationInput.value.includes('GPS:')) {
          const originalVal = locationInput.value ? locationInput.value.trim() + ' ' : '';
          locationInput.value = `${originalVal}[GPS: ${lat}, ${lng}]`;
        }

        // Trigger draft auto-save if available
        if (typeof saveDraftToLocalStorage === 'function') {
          saveDraftToLocalStorage();
        }

        btnGeo.disabled = false;
      },
      (error) => {
        btnGeo.disabled = false;
        let errMsg = 'Failed to retrieve location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errMsg = 'Location permission denied by user.';
            break;
          case error.POSITION_UNAVAILABLE:
            errMsg = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errMsg = 'Location request timed out.';
            break;
        }

        if (geoStatus) {
          geoStatus.className = 'text-danger small mt-1';
          geoStatus.innerHTML = `<i class="bi bi-x-circle-fill me-1"></i>${errMsg}`;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

document.addEventListener('DOMContentLoaded', initGeolocation);
