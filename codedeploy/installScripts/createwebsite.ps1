 #############################################
 # am I running in 32 bit shell?
 #############################################
 if ($pshome -like "*syswow64*") {
 
    Write-Warning "Restarting script under 64 bit powershell"
  
    # relaunch this script under 64 bit shell
    & (join-path ($pshome -replace "syswow64", "sysnative") powershell.exe) -file `
      (join-path $psscriptroot $myinvocation.mycommand) @args
  
    # exit 32 bit script
    exit $lastexitcode
  }

#
# Variable Definition
#
$webAppName = "MyWebApp"
$website = "Default Web Site"

$webAppPath = "c:\inetpub\wwwroot\" + $webAppName
$webApplication = "IIS:\sites\" + $website + "\" + $webAppName

# 

#
# Check to see if the directory exists. If it does not, create it, and then create the web site.
#
if (-not (Test-Path $webAppPath)) 
{ 
    New-Item -ItemType directory -Path $webAppPath

    #
    # Set up the web application in the default web site.
    #
    New-WebApplication -Name $webAppName -ApplicationPool ".NET v4.5" -PhysicalPath $webAppPath -Site $website -force
    Set-WebConfiguration system.web/authentication $webApplication -value @{mode='Forms'}
    
    # I added the below line because I had random failures on first deploy (overwrite issues)
	  Get-ChildItem $webAppPath -Recurse | Remove-Item
}
else
{
	Get-ChildItem $webAppPath -Recurse | Remove-Item
}

