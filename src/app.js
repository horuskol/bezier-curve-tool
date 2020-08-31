import Vue from 'vue';

import BezierCurveTool from './components/bezier-curve-tool';

Vue.component('bezier-curve-tool', BezierCurveTool);

var app = new Vue({
    el: '#app'
});
