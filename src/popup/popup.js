const React = require("react");
const { createRoot } = require("react-dom/client");

// Hanging bulb animation component
function HangingBulbTimer({ lightbulbTime }) {
  const [flickerOpacity, setFlickerOpacity] = React.useState(1);

  React.useEffect(() => {
    const flicker = () => {
      // Random flicker with varying intensity
      const randomFlicker = Math.random();
      if (randomFlicker > 0.92) {
        // Occasional noticeable flicker
        setFlickerOpacity(0.3 + Math.random() * 0.4);
        setTimeout(() => setFlickerOpacity(1), 50 + Math.random() * 100);
      } else if (randomFlicker > 0.85) {
        // Subtle flicker
        setFlickerOpacity(0.85 + Math.random() * 0.15);
        setTimeout(() => setFlickerOpacity(1), 30);
      }
    };

    const interval = setInterval(flicker, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bulb-container">
      {/* Bulb */}
      <div className="bulb-wrapper">
        <div 
          className="bulb-glow"
          style={{ opacity: flickerOpacity }}
        >
          <svg 
            width="80" 
            height="80" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="bulb-svg"
          >
            <path 
              d="M12 2C8.13 2 5 5.13 5 9C5 11.38 6.19 13.47 8 14.74V17C8 17.55 8.45 18 9 18H15C15.55 18 16 17.55 16 17V14.74C17.81 13.47 19 11.38 19 9C19 5.13 15.87 2 12 2ZM15 16H9V15.28C9.6 15.62 10.28 15.8 11 15.8C11.72 15.8 12.4 15.62 13 15.28V16ZM12 13C10.35 13 9 11.65 9 10C9 8.35 10.35 7 12 7C13.65 7 15 8.35 15 10C15 11.65 13.65 13 12 13Z" 
              fill="currentColor"
            />
          </svg>
        </div>
        
        {/* Glow effect */}
        <div className="bulb-glow-effect" style={{ opacity: flickerOpacity * 0.3 }}></div>
      </div>

      {/* Time Display */}
      <div className="bulb-time-simple">
        <div className="bulb-time-label">Light Saved</div>
        <div className="bulb-time-value">{lightbulbTime}</div>
      </div>
    </div>
  );
}

// Semi-circle progress bar component
function SemiCircleProgress({ progress, label, bottlesSaved }) {
  const radius = 100;
  const circumference = Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="progress-container">
      <div className="progress-wrapper">
        <svg width="240" height="140" viewBox="0 0 240 140" className="progress-svg">
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0F52BA" />
              <stop offset="50%" stopColor="#57A0D2" />
              <stop offset="100%" stopColor="#89CFEF" />
            </linearGradient>
          </defs>
          {/* Background arc */}
          <path 
            d="M 20 120 A 100 100 0 0 1 220 120" 
            fill="none" 
            stroke="rgba(255, 255, 255, 0.3)" 
            strokeWidth="16" 
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <path 
            d="M 20 120 A 100 100 0 0 1 220 120" 
            fill="none" 
            stroke="url(#progressGradient)" 
            strokeWidth="16" 
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>

        <div className="progress-content">
          <div className="progress-percentage">{progress}%</div>
          <div className="progress-label">{label}</div>
          <div className="progress-bottles">{Math.floor(bottlesSaved)} bottles</div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = React.useState("main");
  const [settings, setSettings] = React.useState({
    buttonColor: "#4a90e2",
    darkMode: false,
    strategy: "auto",
    removeFiller: true,
    simplifySentences: true,
    aggressiveMode: false,
  });
  const [status, setStatus] = React.useState("");
  const [tokensSaved, setTokensSaved] = React.useState(0);
  const [waterSaved, setWaterSaved] = React.useState(0);
  const [bottlesSaved, setBottlesSaved] = React.useState(0);
  const [progress, setProgress] = React.useState(0);
  const [lightbulbTime, setLightbulbTime] = React.useState("");
  const [totalSeconds, setTotalSeconds] = React.useState(0);

  // Get storage API (Chrome or Firefox)
  const getStorage = () => {
    return chrome?.storage?.sync || browser?.storage?.sync;
  };

  // Load settings on mount
  React.useEffect(() => {
    const storage = getStorage();
    if (!storage) return;

    storage.get(
      [
        "buttonColor",
        "darkMode",
        "strategy",
        "removeFiller",
        "simplifySentences",
        "aggressiveMode",
        "tokensSaved",
      ],
      (data) => {
        const loadedSettings = {
          buttonColor: data.buttonColor || "#4a90e2",
          darkMode: data.darkMode ?? false,
          strategy: data.strategy || "auto",
          removeFiller: data.removeFiller ?? true,
          simplifySentences: data.simplifySentences ?? true,
          aggressiveMode: data.aggressiveMode ?? false,
        };
        setSettings(loadedSettings);
        setTokensSaved(data.tokensSaved || 0);
        
        // Apply styles
        document.documentElement.style.setProperty(
          "--button-color",
          loadedSettings.buttonColor
        );
        applyTheme(loadedSettings.darkMode);
      }
    );
  }, []);

  // Calculate water saved (1 token = 1 mL)
  // Progress goal: 474 mL = 100%
  // Water bottle size: 474 mL
  // Lightbulb: 1 token = 0.018 Wh = 12.96 seconds for 5W LED bulb
  React.useEffect(() => {
    const water = tokensSaved; // 1 token = 1 mL
    setWaterSaved(water);
    
    // Calculate bottles saved (474mL per bottle)
    const bottles = water / 474;
    setBottlesSaved(bottles);
    
    // Calculate progress (474 mL = 100%)
    const goalMilliliters = 474;
    const progressPercent = Math.min(100, Math.round(((water % goalMilliliters)/goalMilliliters) * 100));
    setProgress(progressPercent);
    
    // Calculate lightbulb time (1 token = 12.96 seconds for 5W LED)
    const calculatedTotalSeconds = tokensSaved * 12.96;
    setTotalSeconds(calculatedTotalSeconds);
    
    const hours = Math.floor(calculatedTotalSeconds / 3600);
    const minutes = Math.floor((calculatedTotalSeconds % 3600) / 60);
    const seconds = Math.floor(calculatedTotalSeconds % 60);
    
    let timeString = "";
    if (hours > 0) {
      timeString = `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      timeString = `${minutes}m ${seconds}s`;
    } else {
      timeString = `${seconds}s`;
    }
    setLightbulbTime(timeString);
  }, [tokensSaved]);

  const applyTheme = (isDark) => {
    if (isDark) {
      document.documentElement.style.setProperty("--bg-color", "#1e1e1e");
      document.documentElement.style.setProperty("--text-color", "#f1f1f1");
    } else {
      document.documentElement.style.setProperty("--bg-color", "#ffffff");
      document.documentElement.style.setProperty("--text-color", "#111111");
    }
  };

  const handleSave = () => {
    const storage = getStorage();
    if (!storage) return;

    storage.set(settings, () => {
      document.documentElement.style.setProperty(
        "--button-color",
        settings.buttonColor
      );
      applyTheme(settings.darkMode);
      setStatus("✅ Settings saved!");
      setTimeout(() => setStatus(""), 1500);
    });
  };

  const handleInputChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    
    // Live updates for color and dark mode
    if (field === "buttonColor") {
      document.documentElement.style.setProperty("--button-color", value);
    } else if (field === "darkMode") {
      applyTheme(value);
    }
  };

  return (
    <>
      {/* Tab buttons */}
      <div className="tabs">
        <div
          className={`tab ${activeTab === "main" ? "active" : ""}`}
          onClick={() => setActiveTab("main")}
        >
          Main
        </div>
        <div
          className={`tab ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          Settings
        </div>
      </div>

      {/* Main tab content */}
      {activeTab === "main" && (
        <div className="tab-content active">
          <div className="impact-card">
            <h3 className="impact-title">Your Impact</h3>

            {/* Progress Bar and Bulb Container */}
            <div className="progress-bulb-container">
              <SemiCircleProgress 
                progress={progress}
                label="Water Bottles Saved"
                bottlesSaved={bottlesSaved}
              />
              <HangingBulbTimer 
                lightbulbTime={lightbulbTime}
              />
            </div>

            <div className="metric">
              <span className="metric-label">Tokens Saved</span>
              <span className="metric-value">{tokensSaved}</span>
            </div>

            <div className="metric">
              <span className="metric-label">Water Saved</span>
              <span className="metric-value">{waterSaved} mL</span>
            </div>

            <div className="metric">
              <span className="metric-label">5W LED Bulb Time</span>
              <span className="metric-value">{lightbulbTime}</span>
            </div>
          </div>
        </div>
      )}

      {/* Settings tab content */}
      {activeTab === "settings" && (
        <div className="tab-content active">
          <h3>Settings</h3>

          <h4>Style</h4>

          <label>
            Dark Mode
            <input
              type="checkbox"
              checked={settings.darkMode}
              onChange={(e) => handleInputChange("darkMode", e.target.checked)}
            />
          </label>

          <label>
            Button color
            <input
              type="color"
              value={settings.buttonColor}
              onChange={(e) => handleInputChange("buttonColor", e.target.value)}
            />
          </label>

          <h4>Output Optimization</h4>

          <label htmlFor="output_optimization_strategy">
            Strategy
            <select
              id="strategy"
              name="output_strategy"
              value={settings.strategy}
              onChange={(e) => handleInputChange("strategy", e.target.value)}
            >
              <option value="auto">auto</option>
              <option value="simple">simple</option>
              <option value="detailed">detailed</option>
              <option value="format">format</option>
              <option value="context">context</option>
              <option value="token">token</option>
              <option value="tldr">tldr</option>
            </select>
          </label>

          <h4>Replacement</h4>

          <label>
            Remove Filler
            <input
              type="checkbox"
              checked={settings.removeFiller}
              onChange={(e) => handleInputChange("removeFiller", e.target.checked)}
            />
          </label>

          <label>
            Simplify Sentences
            <input
              type="checkbox"
              checked={settings.simplifySentences}
              onChange={(e) => handleInputChange("simplifySentences", e.target.checked)}
            />
          </label>

          <label>
            Aggressive Mode
            <input
              type="checkbox"
              checked={settings.aggressiveMode}
              onChange={(e) => handleInputChange("aggressiveMode", e.target.checked)}
            />
          </label>

          <button onClick={handleSave}>Save Settings</button>
          <div id="status">{status}</div>
        </div>
      )}
    </>
  );
}

// Render the app
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("root");
  const root = createRoot(container);
  root.render(<App />);
});
