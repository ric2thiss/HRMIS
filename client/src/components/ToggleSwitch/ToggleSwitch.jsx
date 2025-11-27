import React from "react";

export default function ToggleSwitch({ enabled, onChange }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`
        relative inline-flex h-6 w-12 items-center rounded-full transition-colors
        ${enabled ? "bg-blue-600" : "bg-gray-300"}
      `}
    >
      <span
        className={`
          inline-block h-5 w-5 transform rounded-full bg-white transition-transform
          ${enabled ? "translate-x-6" : "translate-x-1"}
        `}
      />
    </button>
  );
}
