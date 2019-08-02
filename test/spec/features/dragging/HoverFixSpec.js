/* global sinon */

import {
  bootstrapDiagram,
  inject
} from 'test/TestHelper';

import { createCanvasEvent as canvasEvent } from '../../../util/MockEvents';

import dragModule from 'lib/features/dragging';


describe('features/dragging - HoverFix', function() {

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


  describe('behavior', function() {

    beforeEach(inject(function(dragging) {
      dragging.setOptions({ manual: true });
    }));


    it('should ensure hover', inject(function(dragging, hoverFix) {

      // given
      var fixed = false;

      hoverFix.ensureHover = function(event) {
        fixed = true;
      };

      // when
      dragging.init(canvasEvent({ x: 10, y: 10 }), 'foo');
      dragging.move(canvasEvent({ x: 30, y: 20 }));
      dragging.move(canvasEvent({ x: 5, y: 10 }));

      // then
      expect(fixed).to.be.true;
    }));


    it('should ensure out', inject(function(dragging, eventBus) {

      // given
      var listener = sinon.spy(function(event) {
        var element = event.element;

        expect(element).to.exist;
        expect(element).to.eql(shape1);
      });

      eventBus.on('element.out', listener);

      // when
      dragging.init(canvasEvent({ x: 10, y: 10 }), 'foo');
      dragging.hover({ element: shape1 });
      dragging.hover({ element: shape2 });

      // then
      expect(listener).to.have.been.calledOnce;

    }));

  });

});
