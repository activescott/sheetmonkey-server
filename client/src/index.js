import $ from "jquery";

import App from './Components/App.html';

$(() => {
  var currentComponent;

  console.log('init app.');
  //let target = document.querySelector('#main');//
  let target = $('#main').get(0);
  console.assert(target, 'no target!');

  currentComponent = new App({
    target: target,
    data: {name: 'world' }
  });

  setTimeout(() => {
    console.log('everyone...');
    currentComponent.set({name:'everyone'});
  }, 1000);
  
});


