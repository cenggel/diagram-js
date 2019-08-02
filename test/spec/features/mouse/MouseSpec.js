import {
  bootstrapDiagram,
  inject
} from 'test/TestHelper';

import mouseModule from 'lib/features/mouse';

import { createMousemoveEvent } from 'lib/features/mouse/Mouse';


describe('features/mouse', function() {

  beforeEach(bootstrapDiagram({ modules: [ mouseModule ] }));


  it('should return last mousemove event', inject(function(canvas, mouse) {

    // when
    mousemoveEvent(canvas._svg);

    // then
    expect(mouse.getLastMousemoveEvent()).to.exist;
  }));


  it('should always return event', inject(function(mouse) {

    // then
    expect(mouse.getLastMousemoveEvent()).to.exist;
  }));

});

// helpers //////////

function mousemoveEvent(element) {

  var event = createMousemoveEvent(0, 0);

  element.dispatchEvent(event);

  return event;
}