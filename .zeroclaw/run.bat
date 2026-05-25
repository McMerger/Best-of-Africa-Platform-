@echo off
REM ════════════════════════════════════════════════════════════════
REM  Best of Africa – ZeroClaw Agent Gateway Launcher
REM  Runs the ZeroClaw cron gateway using the BoA skill config.
REM  Requires: cargo build --release inside the zeroclaw\ folder.
REM ════════════════════════════════════════════════════════════════
echo Starting Best of Africa ZeroClaw agent gateway...
echo Provider: Gemini (OAuth - no API key required)
echo Skills: article-generator, proactive-editorial, self-improving-editorial
echo.

REM Point to the prebuilt binary
set ZEROCLAW_BIN=%USERPROFILE%\.zeroclaw\bin\zeroclaw.exe

REM Set Gemini OAuth Client ID (from Gemini CLI)
set GEMINI_OAUTH_CLIENT_ID=681255809395-oo8ft2oprdrnc9e3aqf6av3hmdib135j.apps.googleusercontent.com

if not exist "%ZEROCLAW_BIN%" (
    echo ERROR: ZeroClaw binary not found at %ZEROCLAW_BIN%
    echo.
    echo Build it first:
    echo   cd "%~dp0zeroclaw"
    echo   cargo build --release
    pause
    exit /b 1
)

REM Run the gateway — cron jobs fire automatically per .zeroclaw\config.json
"%ZEROCLAW_BIN%" gateway --config-dir "%~dp0.zeroclaw"
