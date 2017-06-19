'use strict';
import Promise from 'bluebird';

class Xhr {
  static getJSON(url, headers) {
      return new Promise((resolve, reject) => {
          let xhr = new XMLHttpRequest();
          xhr.open("GET", url, true);
          if (headers) {
              for (var header in headers) {
                  console.log('found header:', header, '=', headers[header]);
                  xhr.setRequestHeader(header, headers[header])
              }
          }
          xhr.onreadystatechange = () => {
              if (xhr.readyState == 4) {
                  if (xhr.status < 200 || xhr.status >= 300)
                      return reject(new Error(`Server at url '${url}' returned error status '${xhr.status}'. StatusText: '${xhr.statusText}'. ResponseText: ${xhr.responseText}`));
                  try {
                      return resolve(JSON.parse(xhr.responseText));
                  } catch (e) {
                      return reject(new Error(`Failed to parse JSON from url '${url}'. Error: ${e}\n Response was: '${xhr.responseText}'`))
                  }
              }
          }
          xhr.send();
      });        
  }
}

export default Xhr;
