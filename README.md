# Problem statement #
Enable browser-based cloud applications to embed third party browser-based plugins (JavaScript plugins) that can securely get an OAuth token to access the REST API of the cloud app. These JavaScript plugins should not require a separate *custom* backend server so that creating and hosting these plugins is low cost to create and operate.

## Traditional Solutions ##
With most browser-based applications (of which the JavaScript plugins are very similar to) they implement one of two techniques for getting authorization to an application's REST API: A custom backend or they leverage the OAuth implicit grant.

### Custom Backend ###
A custom backend server to serve the JavaScript and serve as a gateway for API calls from the JavaScript to the host's REST API. The backend serves two purposes here:
1. The backend, what OAuth calls a "confidential client", protects "client secret" so that an attacker cannot improperly get API access (i.e. OAuth access tokens) by spoofing the API "Client" and getting access to OAuth tokens.
2. The backend authenticates the JavaScript (usually relying on [XSRF prevention techniques](https://en.wikipedia.org/wiki/Cross-site_request_forgery#Prevention)).
3. Since the browser-based JavaScript routes any requests only to the backend and the backend will make calls to the REST API on behalf of the JavaScript, usually the backend effectively limits the amount of the REST API that the an attacker spoofing the JavaScript could access if they are able to spoof the JavaScript. With input validation and optimizing the backend to the JavaScript's use case, generally these limitations are pretty severe limitations. They can still be exploited, but generally they expose a tiny subset of the backend REST API's operations.

### Implicit Grant ###
The [OAuth spec details the implicit grant](https://tools.ietf.org/html/rfc6749#section-4.2) so I won't do so here. Effectively the JavaScript has no backend as a confidential client and makes requests directly to the REST API. A couple of undesirable aspects to this approach:
1. The JavaScript is almost entirely unauthenticated. A redirection API can be used to help here, but it is not very effective.
2. Other than using OAuth scopes, which are generally course grained limitations, LOTS of the REST API is exposed and becomes vulnerable to attackers.


# Requirements / Goals #
1. No backend. Normally this problem is solved by implementing a backend service to make the API calls (to serve as a *confidential client*) and then the backend authenticate's the browser-hosted public client (usually with a cookie). However, writing a custom backend is overkill when we have most logic for a browser-based application running *in the browser*.
2. Security Goals:
    1. The Host App must ensure that only the right plugin gets his access tokens (i.e. authenticate the plugin).
    2. The plugin must ensure that the access token's she gets are intended for her (i.e. authenticate the host or audience-restrict the token). See https://tools.ietf.org/html/rfc6749#section-10.16 for reasons why.
    3. The User (OAuth resource owner) should be prompted to explicitly authorize access to each plugin.
    4. Restrict the plugins access to the API to an absolute minimum of operations (with more fine-grained control than OAuth scopes).
3. CORS: Assume the host's API doesn't support CORS headers.
        * The Host API must generally accept CORS. For now, we will assume the browser extension will monkey patch the CORS headers.

## Why Traditional Solutions Fall Short ##
* A custom backend is costly to create and operate making the barrier to entry for plugin authors high.
* Implicit flow doesn't offer adequate security since the plugins aren't authenticated (especially without a backend) to ensure they receive the tokens intended for them.


# Solutions Considered #
## App-Issued Tokens via [OAuth Authorization Code Grant](https://tools.ietf.org/html/rfc6749#section-4.1) (or Browser Extension as a proxy for the app) ##
Register the Host App itself as the redirection URI for the OAuth code. It is assumed the Host App *does* have a backend and that the Host App trusts its related REST API.

### Requirements Check ###
1.1: Ok, but note that the implication here is that the OAuth client secret for the plugin *is* given to the Host App. Since the Host App and its REST API are already connected, this seems acceptable.
2.1: Assuming the Host App uses a sandboxed IFrame or a Web Worker for loading the plugin in an isolated environment, it will have to take steps to ensure it loads the plugin and any hosting code in the plugins' isolated area in a way that it can use to authenticate the plugin. 
    * The plugin must be loaded over https to know the code came from the right place.
    * The plugin proxy being injected into the isolated iframe could be done by appending a signature as a query string on the end of the JavaScript files that the plugin code, once loaded, will use to authenticate itself back to the host (i.e. similar to an XSRF prevention technique).
2.2: Include an audience claim -signed by the Hosting App- so that the plugin can authenticate the token.
2.3: Use an OAuth flow (can be triggered by the plugin) to ensure the user is adequately prompted (according to the authorization policies of the hosted app/REST API).
2.4: DOH!
    * The plugin should register with the Host App (separate from the plugin's own hosting) precisely what API operations it needs to further restrict the API operations the plugin (or an attacker spoofing the plugin) could access. THen the host app should essentially either support CORS or provide a proxy that enables it.

**Good.**

### Misc Notes ###
* The JSHost/Proxy in the plugins' isolated environment should provide helper methods to easily and properly kick off the OAuth flow and receive a token.
* Refresh Tokens: The plugin should never store the token, and just always ask the host for it. The host can ensure it is properly refreshed.
    * Ideally, the refresh token is never exposed to the plugin's isolated environment.


### Workarounds when Core Application Doesn't Support Plugins ###
For now, without support of a core application we rely on some workarounds:
* Use a browser extension - i.e. SheetMonkey to hack in the extensibility points.
* Standup a backend service to work in unison with the browser extension. It provides the following features:
    1. Plugin authors can register their client secrets with the backend (where they can be kept confidential, as they cannot be inside the extension) and setup this backend as the redirect URL for their OAuth client.
    2. When the plugin receives an OAuth code via redirect for a registered client, it will get the token (using the secret on the confidential backend) and then redirect once more to the browser extension's special URL (chrome provides this via the Identity API). The private URL for the extension provides a (low? moderate?) level of authentication of the client so that only the browser extension gets tokens.
        - Security Note: This can still be gotten around because the extension's URL isn't hard to figure out. Once figured out, chrome will still redirect to it and the token will be in the URL so it is exposed to the user agent. Still it requires a user/resource owner to be in the process of successfully authenticating with the app so the combination of factors seems to be a moderate level of mitigation of attacks here. The user could install a compromised browser extension to monitor for these tokens, but if the user has a compromised extension everything in the browser is compromised already (session cookies, network traffic via XHR, etc.)




## Generic API Proxy Backend ##
* Provide a generic, very simple backend service application that has the following capabilities:
    * ~~Authenticates the client web app using a short lived cookie - note that this doesn't really authenticate the client, just the user's session but issues a very short lived cookie.~~
    * Authenticate the client, and upon redirect back with a valid code, encrypt the access/refresh tokens and time in the cookie using a per-app key. 
            * I like this approach because we don't rely on dynamic storage necessary of the backend (no storage per request or anything). The service is stateless with only very simple configuration.
            * The client also doesn't have access to the accestoken/key since they're encrypted. The client just round trips it to the server with API proxy requests and they are extracted (and refreshed as needed) and used to authorize the proxied API calls.
    * Keeps the client secret secret.
    * ~~Stores access token, expiration time, and refresh token.~~
    * Proxies all API calls to the REST API - by adding the appropriate access token to the requests.
    * Can use Configuration to whitelist allowed operations per app.

### Configuration ###
The following can be configured for each app:
* API auth endpoints
* App's client id & secret
* **A whitelist of allowed operations** - both the verb and paths (no query params or payload restrictions).
    * Use regex
    * By limiting the operations this way, we can dramaticaly limit the attack surface of any comprimised clients.
* A private key used to encrypt cookies (jwt?).


### Benefits ###
* Benefits over a custom backend for your app:
    * Backends are heavy handed. Of course it's "easy" to write code to proxy API calls and issue cookies to a client, but it takes time to dev & test and why should this simple thing be different for every app?
    * Keep your whole app in client-side javascript without having to maintain and code a backend.


### Tradeoffs/Drawbacks ###
* If you need to store data for your app separate from the API you're authorizing then this probably isn't for you. 
    * *Long term I'd like to find a solution for this though too.*




### Flow ###

User -> S3: Get static HTML+JSApp files

JSApp -> APIProxy

### Open Issues ###
* NON GOALS???
    * But you need a database anyway? Use a cloud-based storage service with a REST API for storage directly from the app (google, azure, cloud).
        * DOH! How to auth to that API??
            * Upon succesful auth, allow the backend to be configured to do the following:
                * Generate a signed OIDC token for the user (based on a "me" endpoint request from the primary API)
                * Use the OIDC token with another backend (e.g. STS [AssumeRoleWithWebIdentity](http://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRoleWithWebIdentity.html) and a secret key) to return a temproary token and issue the token in a response header or cookie (prefer cookie since browsers should be taking steps to keep them secure).
                * How can the above work with DB services other than AWS???
                    * See Shared Access Signature at Azure https://docs.microsoft.com/en-us/azure/storage/storage-dotnet-shared-access-signature-part-1
                    * Simperium allows getting "access tokens" on behalf of a user.
                    * Google nyet. Firebase close: https://firebase.google.com/docs/auth/web/anonymous-auth
                * **Open Issues**:
                    * How do you secure the backend to a single user? For example, how to use IAM policy rules to keep users out of each others' storage areas/buckets?


## Browser extension ##
* (Chrome Only?) Use a browser extension and the chrome [chrome.identity API's launchWebAuthFlow](https://developer.chrome.com/extensions/identity#method-launchWebAuthFlow) to get a code to the browser-based app and have the JavaScript get the token via the token endpoint. 
* Open Issues:
    * Client Secret is exposed in the browser-based app or the extension.

    



# References #
* Implicit Grant: https://tools.ietf.org/html/rfc6749#section-1.3.2
* Implicit Grant in Azure AD: https://docs.microsoft.com/en-us/azure/active-directory/develop/active-directory-dev-understanding-oauth2-implicit-grant
* https://github.com/captncraig/cors/blob/master/cors.go
* AWS Lambda & Secrets:
    * AWS Lambda encrypts/decrypts all environment variables by default: http://docs.aws.amazon.com/lambda/latest/dg/env_variables.html#env-storing-sensitive-data
    * Serverless also supports automatic encryption/decription of secrets in a repo: https://github.com/serverless/examples/tree/master/aws-node-env-variables-encrypted-in-a-file
* Severless + DynamoDB:
    * https://github.com/serverless/examples/tree/master/aws-python-rest-api-with-dynamodb