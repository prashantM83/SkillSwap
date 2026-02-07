import React, { useEffect, useRef, useState } from "react";
import { getJitsiInfo } from "../services/sessionService";
import { RefreshCw, AlertCircle, Video, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JitsiMeetProps {
  sessionId: string;
  userName: string;
  onClose: () => void;
}

// Extend window type for Jitsi API
declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export const JitsiMeet: React.FC<JitsiMeetProps> = ({
  sessionId,
  userName,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jitsiLoaded, setJitsiLoaded] = useState(false);

  // Load Jitsi External API script
  useEffect(() => {
    // Check if script already loaded
    if (window.JitsiMeetExternalAPI) {
      setJitsiLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://meet.jit.si/external_api.js";
    script.async = true;

    script.onload = () => {
      setJitsiLoaded(true);
    };

    script.onerror = () => {
      setError(
        "Failed to load Jitsi Meet. Please check your internet connection.",
      );
      setLoading(false);
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount if needed
    };
  }, []);

  // Initialize Jitsi when script is loaded
  useEffect(() => {
    if (!jitsiLoaded || !containerRef.current) return;

    const initJitsi = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get room info from backend
        const jitsiInfo = await getJitsiInfo(sessionId);

        // Initialize Jitsi
        const domain = "meet.jit.si";
        const options = {
          roomName: jitsiInfo.roomId,
          width: "100%",
          height: "100%",
          parentNode: containerRef.current,
          userInfo: {
            displayName: userName,
          },
          configOverwrite: {
            startWithAudioMuted: true,
            startWithVideoMuted: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            enableClosePage: false,
            hideConferenceSubject: false,
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              "microphone",
              "camera",
              "desktop",
              "fullscreen",
              "hangup",
              "chat",
              "settings",
              "raisehand",
              "tileview",
              "select-background",
            ],
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            BRAND_WATERMARK_LINK: "",
            DEFAULT_BACKGROUND: "#1e1e2e",
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
            MOBILE_APP_PROMO: false,
            HIDE_INVITE_MORE_HEADER: true,
          },
        };

        // Create Jitsi API instance
        const api = new window.JitsiMeetExternalAPI(domain, options);
        apiRef.current = api;

        // Set subject/title
        api.executeCommand("subject", jitsiInfo.roomName);

        // Event handlers
        api.addEventListener("videoConferenceJoined", () => {
          setLoading(false);
        });

        api.addEventListener("videoConferenceLeft", () => {
          handleLeave();
        });

        api.addEventListener("readyToClose", () => {
          handleLeave();
        });
      } catch (err: any) {
        console.error("Error initializing Jitsi:", err);
        setError(err.message || "Failed to start video call");
        setLoading(false);
      }
    };

    initJitsi();

    // Cleanup on unmount
    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [jitsiLoaded, sessionId, userName]);

  const handleLeave = () => {
    if (apiRef.current) {
      apiRef.current.dispose();
      apiRef.current = null;
    }
    onClose();
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-100 rounded-lg p-8">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Video Call Error
        </h3>
        <p className="text-gray-600 text-center mb-4">{error}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
          <Button variant="destructive" onClick={onClose}>
            <PhoneOff className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 rounded-lg z-10">
          <Video className="w-16 h-16 text-blue-500 mb-4 animate-pulse" />
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mb-4" />
          <p className="text-white text-lg">Connecting to video call...</p>
          <p className="text-gray-400 text-sm mt-2">
            Please allow camera and microphone access when prompted
          </p>
        </div>
      )}

      {/* Jitsi container */}
      <div
        ref={containerRef}
        className="w-full h-full rounded-lg overflow-hidden"
        style={{ minHeight: "400px" }}
      />

      {/* Leave button overlay */}
      {!loading && (
        <div className="absolute top-4 right-4 z-20">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLeave}
            className="shadow-lg"
          >
            <PhoneOff className="w-4 h-4 mr-2" />
            Leave Call
          </Button>
        </div>
      )}
    </div>
  );
};

export default JitsiMeet;
