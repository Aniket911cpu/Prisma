# Prisma - Project Structure

This document outlines the modular file structure used in the Prisma Chrome Extension.

```
/
├── manifest.json              # Extension Configuration (Manifest V3)
├── README.md                  # Project Documentation
├── LICENSE                    # MIT License
├── CHANGELOG.md               # Version History
├── icons/                     # Application Icons
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
├── styles/                    # Global Styles & Design System
│   ├── variables.css          # CSS Variables (Theme, Colors, Typography)
│   └── common.css             # Shared Utility Classes
└── src/                       # Source Code
    ├── background/            # Service Workers
    │   └── service_worker.js  # Background logic (Context menus, Shortcuts)
    ├── content/               # Content Scripts
    │   └── content_script.js  # Page interaction (EyeDropper fallback)
    ├── popup/                 # Main UI (The Extension Popup)
    │   ├── popup.html
    │   ├── popup.js
    │   └── popup.css
    ├── options/               # Settings Page
    │   ├── options.html
    │   ├── options.js
    │   └── options.css
    ├── onboarding/            # Welcome/Onboarding Flow
    │   ├── welcome.html
    │   ├── welcome.js
    │   └── welcome.css
    └── utils/                 # Shared Utilities
        ├── color_math.js      # Color conversions & WCAG math
        ├── storage.js         # Chrome Storage wrapper
        └── export_utils.js    # Export logic (JSON, ASE, CSS)
```
