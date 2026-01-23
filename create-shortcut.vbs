Set WshShell = CreateObject("WScript.Shell")
Set oShellLink = WshShell.CreateShortcut(WshShell.SpecialFolders("Desktop") & "\📦 Stock Management System.lnk")
oShellLink.TargetPath = WScript.ScriptFullName
Set FSO = CreateObject("Scripting.FileSystemObject")
oShellLink.TargetPath = FSO.GetParentFolderName(WScript.ScriptFullName) & "\start-stock-system.bat"
oShellLink.WorkingDirectory = FSO.GetParentFolderName(WScript.ScriptFullName)
oShellLink.Description = "ระบบจัดการสต็อกสินค้า - Stock Management System"
oShellLink.Save

MsgBox "✅ สร้าง Shortcut สำเร็จ!" & vbCrLf & vbCrLf & "📍 ตำแหน่ง: Desktop" & vbCrLf & "📦 ชื่อ: Stock Management System" & vbCrLf & vbCrLf & "🚀 Double-click เพื่อเริ่มใช้งาน", vbInformation, "Stock Management System"
