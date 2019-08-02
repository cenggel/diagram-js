/* global sinon */

import {
  bootstrapDiagram,
  inject
} from 'test/TestHelper';

import { assign } from 'min-dash';

import { createCanvasEvent as canvasEvent } from '../../../util/MockEvents';

import dragModule from 'lib/features/dragging';


describe.only('features/dragging - HoverFix', function() {

  beforeEach(bootstrapDiagram({ modules: [ dragModule ] }));

  var shape1,
      shape2;

  beforeEach(inject(function(canvas, elementFactory) {

    shape1 = elementFactory.createShape({
      id: 'shape1',
      x: 10,
      y: 10,
      width: 50,
      height: 50
    });

    canvas.addShape(shape1);

    shape2 = elementFactory.createShape({
      id: 'shape2',
      x: 100,
      y: 10,
      width: 50,
      height: 50
    });

    canvas.addShape(shape2);

  }));


  describe.only('ensure hover', function() {

    // beforeEach(inject(function(dragging) {
    //   dragging.setOptions({ manual: true });
    // }));


    it.only('should ensure hover', inject(function(dragging, eventBus, canvas) {

      // given
      // var fixed = false;

      // hoverFix.ensureHover = function(event) {
      //   fixed = true;
      // };

      // // when
      // dragging.init(canvasEvent({ x: 10, y: 10 }), 'foo');
      // dragging.move(canvasEvent({ x: 30, y: 20 }));
      // dragging.move(canvasEvent({ x: 5, y: 10 }));

      // // then
      // expect(fixed).to.be.true;

      // given
      var rootElement = canvas.getRootElement(),
          gfx = canvas.getGraphics(rootElement),
          listener = sinon.spy(function(event) {
            expect(event.hover).to.eql(shape1);
            expect(event.hoverGfx).to.eql(canvas.getGraphics(shape1));
          });

      eventBus.on('drag.hover', listener);

      // when
      dragging.init(canvasEvent({ x: 10, y: 10 }), 'foo');
      triggerMouseEvent('mousemove', gfx, { x: 50, y: 20 });
      triggerMouseEvent('mousemove', gfx, { x: 5, y: 10 });
    }));

  });


  describe('ensure out', function() {

    it('should ensure out', inject(function(dragging, canvas, eventBus) {

      // given
      var listener = sinon.spy(function(event) {
        expect(event.hover).to.eql(shape1);
        expect(event.hoverGfx).to.eql(canvas.getGraphics(shape1));
      });

      eventBus.on('drag.out', listener);

      // when
      dragging.init(canvasEvent({ x: 10, y: 10 }), 'foo');
      eventBus.fire('element.hover', { element: shape1, gfx: canvas.getGraphics(shape1) });

      // (no out)
      eventBus.fire('element.hover', { element: shape2, gfx: canvas.getGraphics(shape2) });

      // then
      expect(listener).to.have.been.calledOnce;

    }));


    it('should prevent additional out', inject(function(dragging, canvas, eventBus) {
      // given
      var listener = sinon.spy(function(event) {
        expect(event.hover).to.eql(shape1);
        expect(event.hoverGfx).to.eql(canvas.getGraphics(shape1));
      });

      eventBus.on('drag.out', listener);

      // when
      dragging.init(canvasEvent({ x: 10, y: 10 }), 'foo');
      eventBus.fire('element.hover', { element: shape1, gfx: canvas.getGraphics(shape1) });
      eventBus.fire('element.out', { element: shape1, gfx: canvas.getGraphics(shape1) });
      eventBus.fire('element.hover', { element: shape2, gfx: canvas.getGraphics(shape2) });

      // then
      expect(listener).to.have.been.calledOnce;
    }));


    it('should ensure event order', inject(function(dragging, canvas, eventBus) {

      // given
      var eventNames = [
            'drag.hover',
            'drag.out'
          ],
          events = recordEvents(eventNames, eventBus);

      // when
      dragging.init(canvasEvent({ x: 10, y: 10 }), 'foo');
      eventBus.fire('element.hover', { element: shape1, gfx: canvas.getGraphics(shape1) });
      eventBus.fire('element.hover', { element: shape2, gfx: canvas.getGraphics(shape2) });

      // then
      expect(events).to.eql([
        { type: 'drag.hover', hover: shape1 },
        { type: 'drag.out', hover: shape1 },
        { type: 'drag.hover', hover: shape2 }
      ]);
    }));
  });

});

// helpers /////////////////////

function recordEvents(eventNames, eventBus) {

  var events = [];

  eventNames.forEach(function(eventName) {
    eventBus.on(eventName, function(e) {
      events.push(assign({}, {
        type: e.type,
        hover: e.hover
      }));
    });
  });

  return events;
}

function triggerMouseEvent(type, gfx, canvasPosition) {

  var mockEvent = canvasEvent(canvasPosition);

  var event = document.createEvent('MouseEvent');
  event.initMouseEvent(type, true, true, window, 0, 0, 0,
    mockEvent.x, mockEvent.y, false, false, false, false,
    0, null);

  return gfx.dispatchEvent(event);
}
