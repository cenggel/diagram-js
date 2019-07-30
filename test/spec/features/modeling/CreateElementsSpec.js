import {
  bootstrapDiagram,
  inject
} from 'test/TestHelper';

import modelingModule from 'lib/features/modeling';

import Elements from 'lib/features/create/Elements';

import { getBBox } from 'lib/util/Elements';

import { getMid } from '../../../../lib/layout/LayoutUtil';


describe('features/modeling - create elements', function() {


  beforeEach(bootstrapDiagram({ modules: [ modelingModule ] }));


  var rootShape,
      parentShape,
      newElements;

  beforeEach(inject(function(elementFactory, canvas) {
    rootShape = elementFactory.createRoot({
      id: 'root'
    });

    canvas.setRootElement(rootShape);

    parentShape = elementFactory.createShape({
      id: 'parent',
      x: 100,
      y: 100,
      width: 500,
      height: 300
    });

    canvas.addShape(parentShape, rootShape);

    newElements = new Elements();

    var newShape = elementFactory.createShape({
      id: 'newShape',
      x: 0,
      y: 0,
      width: 100,
      height: 100
    });

    newElements.add(newShape);

    var newShape2 = elementFactory.createShape({
      id: 'newShape2',
      x: 200,
      y: -50,
      width: 200,
      height: 200
    });

    newElements.add(newShape2);

    var newShape3 = elementFactory.createShape({
      id: 'newShape3',
      parent: newShape2,
      x: 250,
      y: 0,
      width: 100,
      height: 100
    });

    newElements.add(newShape3);

    newElements.add(elementFactory.createConnection({
      id: 'connection',
      source: newShape,
      target: newShape2,
      waypoints: [
        { x: 100, y: 50 },
        { x: 200, y: 50 }
      ]
    }));
  }));

  var position = {
    x: 350,
    y: 250
  };


  describe('basics', function() {

    describe('should create', function() {

      it('execute', inject(function(elementRegistry, modeling) {

        // when
        modeling.createElements(newElements, position, parentShape);

        // then
        newElements.forEach(function(newElement) {
          expect(elementRegistry.get(newElement.id)).to.exist;
        });

        expect(parentShape.children).to.have.length(3);

        // expect elements centered around position
        expect(getMid(getBBox(newElements.getAll()))).to.eql(position);
      }));


      it('undo', inject(function(commandStack, elementRegistry, modeling) {

        // given
        modeling.createElements(newElements, position, parentShape);

        // when
        commandStack.undo();

        // then
        newElements.forEach(function(newElement) {
          expect(elementRegistry.get(newElement.id)).not.to.exist;
        });

        expect(parentShape.children).to.have.length(0);
      }));

    });


    it('should have a parent', inject(function(elementRegistry, modeling) {

      // when
      modeling.createElements(newElements, position, parentShape);

      // then
      expect(elementRegistry.get('newShape').parent).to.equal(parentShape);
      expect(elementRegistry.get('newShape2').parent).to.equal(parentShape);
      expect(elementRegistry.get('connection').parent).to.equal(parentShape);

      // child element should have same parent
      expect(elementRegistry.get('newShape3').parent).to.equal(elementRegistry.get('newShape2'));
    }));


    it('should have parentIndex', inject(function(elementRegistry, modeling) {

      // when
      modeling.createElements(newElements, position, rootShape, 0);

      // then
      expect(rootShape.children).to.eql([
        elementRegistry.get('connection'),
        elementRegistry.get('newShape2'),
        elementRegistry.get('newShape'),
        parentShape
      ]);
    }));


    it('should return a graphics element', inject(function(modeling, elementRegistry) {

      // when
      modeling.createElements(newElements, position, parentShape);

      // then
      newElements.forEach(function(newElement) {
        expect(elementRegistry.getGraphics(newElement.id)).to.exist;
      });
    }));

  });

});
