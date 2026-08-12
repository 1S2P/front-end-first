@echo off
REM ─── Supabase Database Setup ─────────────────────────────────────────────────
REM Usage: setup.bat <your-personal-access-token>
REM
REM Get your token at: https://supabase.com/dashboard/account/tokens
REM

if "%1"=="" (
  echo.
  echo  Usage: setup.bat ^<personal-access-token^>
  echo.
  echo  Get your token at:
  echo  https://supabase.com/dashboard/account/tokens
  echo.
  exit /b 1
)

echo.
echo  Logging in to Supabase CLI...
call npx supabase login --token %1
if errorlevel 1 goto :error

echo.
echo  Linking project xxbwbkokvcbwbexyzohg...
call npx supabase link --project-ref xxbwbkokvcbwbexyzohg
if errorlevel 1 goto :error

echo.
echo  Pushing migrations...
call npx supabase db push --include-all
if errorlevel 1 goto :error

echo.
echo  Running seed data...
call npx supabase db push --include-seed
if errorlevel 1 (
  echo  Seed may have already been applied, continuing...
)

echo.
echo  ============================================================
echo   Database setup complete!
echo  ============================================================
echo.
echo  Next steps:
echo   1. Open: https://supabase.com/dashboard/project/xxbwbkokvcbwbexyzohg/auth/users
echo   2. Create user: pratik@danfetea.com  (your admin account)
echo   3. Copy the user UUID from the dashboard
echo   4. Run: node setup-admin.mjs ^<uuid^>
echo.
goto :end

:error
echo.
echo  Setup failed. Check the error above.
echo.
exit /b 1

:end
