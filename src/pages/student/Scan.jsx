import { useRef, useState } from "react";

export default function PermissionsComponent() {
  const videoRef = useRef(null);
  const [location, setLocation] = useState(null);

  const enablePermissions = async () => {
    console.log("Requesting camera & location permissions...");

    try {
      // CAMERA ACCESS
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      console.log("CAMERA STREAM:", stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
        };
      }

      // LOCATION ACCESS
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.log("LOCATION:", pos.coords);
          setLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
        },
        (err) => {
          console.error("LOCATION ERROR:", err);
        }
      );
    } catch (err) {
      console.error("ERROR:", err);
    }
  };

  return (
    <div style={{ padding: 20, color: "white" }}>
      <button
        onClick={enablePermissions}
        style={{
          padding: "10px 16px",
          marginBottom: 20,
          background: "#444",
          color: "white",
          borderRadius: 6,
          border: "1px solid #666",
        }}
      >
        Enable Camera & Location
      </button>

      {/* CAMERA OUTPUT */}
      <div
        style={{
          width: 300,
          height: 200,
          background: "#000",
          borderRadius: 6,
          overflow: "hidden",
          border: "1px solid #333",
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* LOCATION OUTPUT */}
      {location && (
        <p style={{ marginTop: 15 }}>
          📍 Latitude: {location.lat}
          <br />
          📍 Longitude: {location.lon}
        </p>
      )}
    </div>
  );
}
