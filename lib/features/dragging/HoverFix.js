import {
  closest as domClosest
} from 'min-dom';

import {
  toPoint
} from '../../util/Event';

function getGfx(target) {
  var node = domClosest(target, 'svg, .djs-element', true);
  return node;
}

var LOW_PRIORITY = 500;

var HIGH_PRIORITY = 1500;

/**
 * Browsers may swallow certain events (hover, out ...) if users are to
 * fast with the mouse.
 *
 * @see http://stackoverflow.com/questions/7448468/why-cant-i-reliably-capture-a-mouseout-event
 *
 * The fix implemented in this component ensure that we
 * 1) have a hover state after a successive drag.move event
 * 2) have an out event when dragging leaves an element
 *
 * @param {EventBus} eventBus
 * @param {Dragging} dragging
 * @param {ElementRegistry} elementRegistry
 */
export default function HoverFix(eventBus, dragging, elementRegistry) {

  var self = this;

  /**
   * we wait for a specific sequence of events before
   * emitting a fake drag.hover event.
   *
   * Event Sequence:
   *
   * drag.start
   * drag.move
   * drag.move >> ensure we are hovering
   */
  eventBus.on('drag.start', function(event) {

    eventBus.once('drag.move', function() {

      eventBus.once('drag.move', function(event) {

        self.ensureHover(event);
      });
    });
  });


  /**
   *  make sure we definitely fire one (and only one)
   * 'out' event between two 'hover'
   */
  eventBus.on('drag.hover', LOW_PRIORITY, function(event) {

    if (!event.hover) {
      return;
    }

    var previousHovered = event.hover,
        gfx = elementRegistry.getGraphics(previousHovered),
        outEventFired;

    // make sure out event only fired once
    eventBus.once('element.out', function(e) {
      var element = e.element;

      if (element === previousHovered) {
        outEventFired = true;
      }

    });

    eventBus.once('drag.hover', HIGH_PRIORITY, function(event) {

      var hover = event.hover;

      if (outEventFired || hover === previousHovered) {
        return;
      }

      eventBus.fire('element.out', {
        element: previousHovered,
        gfx: gfx
      });

    });
  });


  /**
   * Make sure we are god damn hovering!
   *
   * @param {Event} dragging event
   */
  this.ensureHover = function(event) {

    if (event.hover) {
      return;
    }

    var originalEvent = event.originalEvent,
        position,
        target,
        element,
        gfx;

    if (!(originalEvent instanceof MouseEvent)) {
      return;
    }

    position = toPoint(originalEvent);

    // damn expensive operation, ouch!
    target = document.elementFromPoint(position.x, position.y);

    gfx = getGfx(target);

    if (gfx) {
      element = elementRegistry.get(gfx);

      dragging.hover({ element: element, gfx: gfx });
    }
  };

}

HoverFix.$inject = [
  'eventBus',
  'dragging',
  'elementRegistry'
];
