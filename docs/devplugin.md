# Developing a Plugin

## Getting Started
Take the following steps:

1. Create a manifest (todo: section with more info)
2. Host your manifest (todo: section with more info)
3. Register your plugin with sheetmonkey.com (todo: section with more info)
4. For API Access, you must register at sheetmonkey.com and register the API Client ID & API Client Secret as explained below under **Smartsheet API Access**


#

## Smartsheet API Access
To get Smartsheet API Access do the following:
1. While logged into Smartsheet, select **Developer Tools** from the **Account** menu.
2. Click **Create New App**
3. Fill in the required fields. For **App redirect URL** you can put in any temporary value for now, but you'll come back here to edit it later. Then click **Save**.
4. On the next screen be sure to save **App client id** and **App secret** (remember that App secret should be kept secret!).
5. Go to https://beta.sheetmonkey.com and Login using the menu in the upper right corner.
6. Once logged in, select **My Plugins** from the upper right menu where your Smartsheet email address is.
7. On the My Plugins screen, click **Add** to register your plugin.
8. Enter your manifest URL that is publically accessible from the Internet and enter the Smartsheet **App client id** and **App secret** you got earlier.
    * Now you should see the **Smartsheet API Redirect URL** for your plugin something like https://beta.sheetmonkey.com/api/pluginauthcallback/https%3A%2F%blah.github.io%2Fmyrepo%2Fmyplugin%2Fmymanifest.json
9. Return to **Developer Tools** in Smartsheet and replace the redirect URL for your app with this one received from sheetmonkey.com.
10. Add `apiClientID` as a root-level property in your manifest file with the value of the client id you received from Smartsheet Developer Tools (NOTE: Do NOT put your client secret in your manifest).
