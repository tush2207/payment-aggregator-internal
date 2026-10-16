$gitDir = "C:\Users\admin\AppData\Local\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\cmd"
$env:Path = "$gitDir;$env:Path"

Write-Output "--- Current Remote Configuration ---"
git remote -v

Write-Output "`n--- Fetching Latest from GitHub ---"
git fetch origin

Write-Output "`n--- Sync Status (Branch vs Remote) ---"
git status -sb
