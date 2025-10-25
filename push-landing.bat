@echo off
cd /d D:\NEW-GO-PROD\go-prod-aura
echo === Branche actuelle ===
git branch --show-current
echo.
echo === Status ===
git status
echo.
echo === Derniers commits locaux ===
git log --oneline -5
echo.
echo === Push vers GitHub ===
git push origin LANDINGPAGE
echo.
echo === Termine ! ===
pause

