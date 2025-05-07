import React, { useState } from "react";


const PersonalizationOptions = () => {
  const [theme, setTheme] = useState("light");
  const [preferences, setPreferences] = useState({
    notifications: true,
    sound: true,
  });

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
    document.body.classList.toggle("dark-theme");
  };

  const handlePreferenceChange = (event) => {
    const { name, checked } = event.target;
    setPreferences((prevPreferences) => ({
      ...prevPreferences,
      [name]: checked,
    }));
  };

  return (
    <div className="personalization-options">
      <h2>🌙 Personalization Options</h2>

      <div className="theme-toggle">
        <label>
          <input type="checkbox" onChange={toggleTheme} />
          Toggle Dark Mode
        </label>
      </div>

      <div className="preferences">
        <label>
          <input
            type="checkbox"
            name="notifications"
            checked={preferences.notifications}
            onChange={handlePreferenceChange}
          />
          Enable Notifications
        </label>
        <label>
          <input
            type="checkbox"
            name="sound"
            checked={preferences.sound}
            onChange={handlePreferenceChange}
          />
          Enable Sound
        </label>
      </div>
    </div>
  );
};

export default PersonalizationOptions;
