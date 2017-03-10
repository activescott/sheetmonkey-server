'use strict';
import Promise from 'bluebird';
import $ from 'jquery';

function xhrGetJSON(url, headers) {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
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
                    return reject(new Error(`Server at url '${url}' returned error status '${xhr.status}'. StatusText: '${xhr.statusText}'`));
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

$(function() {
    let token = $('#jwt').val();
    //YEP! token = 'mangle' + token + 'mangle';
    console.log('token:', token);
    let p = $('<p>');
    p.text(`Calling the API with a token from this file...`);
    $('#content').empty().append(p);

    let apiResponse = xhrGetJSON('api/ping', {"jwt":token}).then(response => {
        console.log('xhr response:', response);
        let div = $('<div>');
        div.append($('<p>API response is:</p>'));
        div.append($('<pre>').text(JSON.stringify(response)));
        $('#content').append(div);
    }).catch(e => {
        $('#content').append($(`<p>Error calling API: ${e}</p>`));
    })
});
