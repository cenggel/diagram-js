export default function Mouse(eventBus) {
  var self = this;

  this._lastMousemoveEvent = null;

  function setLastMousemoveEvent(mousemoveEvent) {
    self._lastMousemoveEvent = mousemoveEvent;
  }

  eventBus.on('canvas.init', function(context) {
    var svg = self._svg = context.svg;

    svg.addEventListener('mousemove', setLastMousemoveEvent);
  });

  eventBus.on('canvas.destroy', function() {
    self._lastMouseEvent = null;

    self._svg.removeEventListener('mousemove', setLastMousemoveEvent);
  });
}

Mouse.$inject = [ 'eventBus' ];

Mouse.prototype.getLastMousemoveEvent = function() {
  return this._lastMousemoveEvent || createMousemoveEvent(0, 0);
};

// helpers //////////

export function createMousemoveEvent(x, y) {
  var event = document.createEvent('MouseEvent');

  var screenX = x,
      screenY = y,
      clientX = x,
      clientY = y;

  if (event.initMouseEvent) {
    event.initMouseEvent(
      'mousemove',
      true,
      true,
      window,
      0,
      screenX,
      screenY,
      clientX,
      clientY,
      false,
      false,
      false,
      false,
      0,
      null
    );
  }

  return event;
}