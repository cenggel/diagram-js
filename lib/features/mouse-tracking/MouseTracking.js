import {
  forEach
} from 'min-dash';

var interactionEventNames = [
  'element.click',
  'element.contextmenu',
  'element.dblclick',
  'element.hover',
  'element.mousedown',
  'element.mousemove',
  'element.mouseup',
  'element.out'
];

var eventNames = [
  'mousemove'
];


export default function MouseTracking(canvas, eventBus) {
  var self = this;

  this._lastMouseEvent = null;
  this._lastMouseEvents = {};

  forEach(interactionEventNames, function(eventName) {
    eventBus.on(eventName, function(event) {
      self._cacheEvent(event, eventName);
    });
  });

  var container = canvas.getContainer();

  var eventListeners = {};

  forEach(eventNames, function(eventName) {
    var eventListener = function(event) {
      self._cacheEvent(event, eventName);
    };

    eventListener[ eventName ] = eventListener;

    container.addEventListener(eventName, eventListener);
  });

  eventBus.on('diagram.destroy', function() {
    self._lastMouseEvent = null;
    self._lastMouseEvents = {};

    forEach(eventListeners, function(eventListener, eventName) {
      container.removeEventListener(eventName, eventListener);
    });

    eventListeners = {};
  });
}

MouseTracking.$inject = [
  'canvas',
  'eventBus'
];

MouseTracking.prototype._cacheEvent = function(event, eventName) {
  this._lastMouseEvent = event;

  this._lastMouseEvents[ eventName ] = event;
};

MouseTracking.prototype.getLastEvent = function(eventName) {
  if (!eventName) {
    return this._lastMouseEvent;
  }

  return this._lastMouseEvents[ eventName ] || null;
};