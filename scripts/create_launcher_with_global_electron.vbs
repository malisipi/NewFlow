Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")
script_dir = fso.GetParentFolderName(WScript.ScriptFullName)
app_dir = fso.GetParentFolderName(script_dir)
desktop_dir = shell.SpecialFolders("Desktop")
apps_dir = shell.ExpandEnvironmentStrings("%APPDATA%") & "\\Microsoft\\Windows\\Start Menu\\Programs\\"

Set desktop_link = shell.CreateShortcut(desktop_dir & "\NewFlow.lnk")
desktop_link.Arguments = app_dir
desktop_link.Description = "Your Free Client"
desktop_link.IconLocation = app_dir & "\\assets\\newflow.ico"
desktop_link.TargetPath = "electron.exe"
desktop_link.WorkingDirectory = app_dir
desktop_link.Save

Set app_link = shell.CreateShortcut(apps_dir & "\NewFlow.lnk")
app_link.Arguments = app_dir
app_link.Description = "Your Free Client"
app_link.IconLocation = app_dir & "\\assets\\newflow.ico"
app_link.TargetPath = "electron.exe"
app_link.WorkingDirectory = app_dir
app_link.Save