Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

desktop_dir = shell.SpecialFolders("Desktop")
apps_dir = shell.ExpandEnvironmentStrings("%APPDATA%") & "\\Microsoft\\Windows\\Start Menu\\Programs\\"

fso.DeleteFile(desktop_dir & "\\NewFlow.lnk")
fso.DeleteFile(apps_dir & "\\NewFlow.lnk")