import {
  bootstrapDiagram,
  inject
} from 'test/TestHelper';

import {
  filter,
  isArray,
  isNumber,
  pick,
  some
} from 'min-dash';

import copyPasteModule from 'lib/features/copy-paste';
import modelingModule from 'lib/features/modeling';
import rulesModule from './rules';
import selectionModule from 'lib/features/selection';


describe('features/copy-paste', function() {

  beforeEach(bootstrapDiagram({
    modules: [
      copyPasteModule,
      modelingModule,
      rulesModule,
      selectionModule
    ]
  }));


  describe('basics', function() {

    var rootShape,
        parentShape,
        parentShape2,
        host,
        attacher,
        childShape,
        childShape2,
        connection;


    beforeEach(inject(function(elementFactory, canvas, modeling) {

      rootShape = elementFactory.createRoot({
        id: 'root'
      });

      canvas.setRootElement(rootShape);

      parentShape = elementFactory.createShape({
        id: 'parent',
        x: 600, y: 200,
        width: 600, height: 300
      });

      canvas.addShape(parentShape, rootShape);

      parentShape2 = elementFactory.createShape({
        id: 'parent2',
        x: 90, y: 15,
        width: 425, height: 300
      });

      canvas.addShape(parentShape2, rootShape);

      host = elementFactory.createShape({
        id: 'host',
        x: 300, y: 50,
        width: 100, height: 100
      });

      canvas.addShape(host, parentShape2);

      attacher = elementFactory.createShape({
        id: 'attacher',
        x: 375, y: 25,
        width: 50, height: 50
      });

      canvas.addShape(attacher, parentShape2);

      modeling.updateAttachment(attacher, host);

      childShape = elementFactory.createShape({
        id: 'childShape',
        x: 110, y: 110,
        width: 100, height: 100
      });

      canvas.addShape(childShape, parentShape2);

      childShape2 = elementFactory.createShape({
        id: 'childShape2',
        x: 400, y: 200,
        width: 100, height: 100
      });

      canvas.addShape(childShape2, parentShape2);

      connection = elementFactory.createConnection({
        id: 'connection',
        waypoints: [
          { x: 160, y: 160 },
          { x: 450, y: 250 }
        ],
        source: childShape,
        target: childShape2
      });

      canvas.addConnection(connection, parentShape2);
    }));

    beforeEach(inject(function(dragging) {
      dragging.setOptions({ manual: true });
    }));


    describe('events', function() {

      it('should fire <elements.copy> if elements are going to be copied', inject(
        function(copyPaste, eventBus) {

          eventBus.on('elements.copy', function(event) {
            var context = event.context,
                tree = context.tree;

            // then
            expect(findElementsInTree(parentShape2, tree, 0)).to.be.true;

            expect(findElementsInTree([
              childShape,
              childShape2,
              connection,
              host
            ], tree, 1)).to.be.true;
          });

          // when
          copyPaste.copy(parentShape2);
        }
      ));


      it('should fire <elements.copied> if were elements copied',
        inject(function(clipboard, copyPaste, eventBus) {

          eventBus.on('elements.copied', function(event) {
            var context = event.context,
                tree = context.tree;

            // then
            expect(clipboard.isEmpty()).to.be.false;
            expect(clipboard.get()).to.equal(tree);
          });

          // when
          copyPaste.copy(parentShape2);
        })
      );

    });


    describe('copy', function() {

      it('should copy elements', inject(function(copyPaste) {

        // when
        var tree = copyPaste.copy(childShape);

        // then
        expect(tree).to.exist;

        expect(findElementInTree(childShape, tree)).to.be.ok;
      }));


      it('should add copied elements to clipboard', inject(function(clipboard, copyPaste) {

        // when
        var tree = copyPaste.copy(parentShape2);

        // then
        expect(tree).to.equal(clipboard.get());
      }));


      it('should copy children of copied elements', inject(function(copyPaste) {

        // when
        var tree = copyPaste.copy(parentShape2);

        // then
        expect(findElementsInTree(parentShape2, tree, 0)).to.exist;

        expect(findElementsInTree([
          childShape,
          childShape2,
          connection,
          host
        ], tree, 1)).to.be.ok;
      }));


      it('should copy attachers and connections of copied elements', inject(function(copyPaste) {

        // when
        var tree = copyPaste.copy([
          childShape,
          childShape2,
          host
        ]);

        // then
        expect(findElementsInTree([
          childShape,
          childShape2,
          connection,
          host
        ], tree, 0)).to.be.ok;
      }));


      it('should NOT copy connection without source', inject(function(copyPaste) {

        // when
        var tree = copyPaste.copy([ childShape, connection ]);


        // then
        expect(findElementsInTree(connection, tree, 0)).to.be.false;

        expect(findElementsInTree(connection, tree, 1)).to.be.false;
      }));


      it('should NOT copy connection without target', inject(function(copyPaste) {

        // when
        var tree = copyPaste.copy([ childShape2, connection ]);


        // then
        expect(findElementsInTree(connection, tree, 0)).to.be.false;

        expect(findElementsInTree(connection, tree, 1)).to.be.false;
      }));


      it('should NOT copy attacher without host', inject(function(copyPaste) {

        // when
        var tree = copyPaste.copy(attacher);

        // then
        expect(tree).not.to.exist;
      }));

    });


    describe('paste', function() {

      it('should paste', inject(function(copyPaste) {

        // given
        copyPaste.copy([
          childShape,
          host
        ]);

        // when
        copyPaste.paste({
          element: parentShape,
          point: {
            x: 900,
            y: 350
          }
        });

        // then
        expect(parentShape.children).to.have.length(2);
      }));

    });

  });


  describe('#createTree', function() {

    var attacherShape,
        childShape1,
        childShape2,
        connection1,
        connection2,
        grandChildShape1,
        grandChildShape2,
        grandChildShape3,
        grandChildShape4,
        hostShape,
        labelShape,
        parentShape;

    beforeEach(function() {
      parentShape = { id: 'parentShape' };
      childShape1 = { id: 'childShape1', parent: parentShape };
      hostShape = { id: 'hostShape', parent: parentShape };
      attacherShape = { id: 'attacherShape', parent: parentShape };

      parentShape.children = [ childShape1, hostShape, attacherShape ];

      hostShape.attachers = [ attacherShape ];
      attacherShape.host = hostShape;

      grandChildShape1 = { id: 'grandChildShape1', parent: childShape1 };
      grandChildShape2 = { id: 'grandChildShape2', parent: childShape1 };

      childShape1.children = [ grandChildShape1, grandChildShape2 ];

      childShape2 = { id: 'childShape2', parent: parentShape };
      grandChildShape3 = { id: 'grandChildShape3', parent: childShape2 };
      grandChildShape4 = { id: 'grandChildShape4', parent: childShape2 };
      labelShape = { id: 'labelShape', parent: childShape2 };

      childShape2.children = [ grandChildShape3, grandChildShape4, labelShape ];

      grandChildShape4.labels = [ labelShape ];
      labelShape.labelTarget = grandChildShape4;

      connection1 = { id: 'connection1', parent: childShape1, waypoints: [] };
      connection2 = { id: 'connection2', parent: parentShape, waypoints: [] };

      connection1.source = grandChildShape1;
      connection1.target = grandChildShape2;

      connection2.source = grandChildShape1;
      connection2.target = grandChildShape3;

      grandChildShape1.outgoing = [ connection1, connection2 ];
      grandChildShape2.incoming = [ connection1 ];
      grandChildShape3.incoming = [ connection2 ];
    });


    it('should create tree', inject(function(copyPaste) {

      // when
      var tree = copyPaste.createTree([ grandChildShape1 ]);

      // then
      expect(findElementInTree(grandChildShape1, tree, 0)).to.be.ok;
    }));


    it('should include children', inject(function(copyPaste) {

      // when
      var tree = copyPaste.createTree([ childShape1 ]);

      // then
      expect(findElementInTree(childShape1, tree, 0)).to.be.ok;

      expect(findElementsInTree([
        grandChildShape1,
        grandChildShape2,
        connection1
      ], tree, 1)).to.be.ok;
    }));


    it('should include labels', inject(function(copyPaste) {

      // when
      var tree = copyPaste.createTree([ grandChildShape4 ]);

      // then
      expect(findElementsInTree([ grandChildShape4, labelShape ], tree, 0)).to.be.ok;
    }));


    it('should update depth', inject(function(copyPaste) {

      // when
      var tree = copyPaste.createTree([ connection2, childShape1, childShape2 ]);

      // then
      // connection is added first but needs to be moved to depth 1 later
      expect(findElementInTree(connection2, tree, 1)).to.be.ok;
    }));


    it('should include connections if source and target are included', inject(function(copyPaste) {

      // when
      var tree = copyPaste.createTree([ grandChildShape1, grandChildShape2 ]);

      // then
      expect(findElementsInTree([
        grandChildShape1,
        grandChildShape2,
        connection1
      ], tree, 0)).to.be.ok;
    }));


    it('should NOT include connections if source is not included', inject(function(copyPaste) {

      // when
      var tree = copyPaste.createTree([ grandChildShape1 ]);

      // then
      expect(findElementInTree(connection2, tree, 0)).not.to.be.ok;
    }));


    it('should NOT include connections if target is not included', inject(function(copyPaste) {

      // when
      var tree = copyPaste.createTree([ grandChildShape3 ]);

      // then
      expect(findElementInTree(connection2, tree, 0)).not.to.be.ok;
    }));

  });

});

// helpers //////////

/**
 * Find elements in a tree.
 * Return found elements or false.
 *
 * @param {Array<djs.model.Base>} elements
 * @param {Object} tree
 * @param {number} [depth]
 *
 * @returns {Array<djs.model.Base>|false}
 */
function findElementsInTree(elements, tree, depth) {
  var foundElements = _findElementsInTree(elements, tree, depth);

  if (foundElements.length !== elements.length) {
    return false;
  }

  return foundElements;
}

/**
 * Find element in a tree.
 * Return found element or false.
 *
 * @param {djs.model.Base} element
 * @param {Object} tree
 * @param {number} [depth]
 *
 * @returns {djs.model.Base|false}
 */
function findElementInTree(elements, tree, depth) {
  var foundElements = _findElementsInTree(elements, tree, depth);

  if (foundElements.length !== 1) {
    return false;
  }

  return foundElements[0];
}

function _findElementsInTree(elements, tree, depth) {
  if (!isArray(elements)) {
    elements = [ elements ];
  }

  var depths;

  if (isNumber(depth)) {
    depths = pick(tree, [ depth ]);
  } else {
    depths = tree;
  }

  return filter(elements, function(element) {

    return some(depths, function(depth) {

      return some(depth, function(descriptor) {
        return element.id === descriptor.id;
      });
    });
  });
}