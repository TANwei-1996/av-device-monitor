Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get the directory where this script is located
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Build the electron command
electronPath = scriptDir & "\node_modules\electron\dist\electron.exe"
appPath = scriptDir

' Check if build exists, if not build first
If Not fso.FileExists(scriptDir & "\dist\main\main\index.js") Then
    WshShell.CurrentDirectory = scriptDir
    WshShell.Run "cmd /c npm run build", 0, True
End If

' Launch electron silently (window style 0 = hidden)
WshShell.CurrentDirectory = scriptDir
WshShell.Run """" & electronPath & """ "".""", 0, False
