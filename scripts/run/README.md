# Universal Run Scripts — Quick Reference

Generic scripts to launch local development and multi-service environments for **ANY project**.  
100% Native Windows Command Prompt (`.bat`) — zero PowerShell required.

---

## 🚀 Quick Start

Double-click `Start-Dev.bat` to automatically launch both Backend and Frontend in separate labeled windows.

---

## 📁 Available Scripts

| Script | Purpose | Detection / Behavior |
| :--- | :--- | :--- |
| **`Start-Dev.bat`** | Master dev launcher | Launches both Backend & Frontend in separate CMD windows |
| **`Start-Backend.bat`** | Backend service runner | Auto-detects FastAPI, Flask, Django, Node/Express, Go, Spring Boot & virtualenvs |
| **`Start-Frontend.bat`** | Frontend dev server | Auto-detects Vite, Next.js, React, Vue, Angular & installs `node_modules` if missing |

---

## 🌐 Dynamic URL & Port Detection

- Ports and environment settings are automatically detected from `.env`, `.env.dev`, or `.env.prod`.
- If missing, `.env.example` is automatically copied to `.env`.
