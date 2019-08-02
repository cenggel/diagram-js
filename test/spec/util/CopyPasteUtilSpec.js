import { getParents } from 'lib/util/CopyPasteUtil';


describe('util/CopyPasteUtil', function() {

  var root = { id: 'root' },
      parent1 = { id: 'parent1', parent: root },
      child1 = { id: 'child1', parent: parent1 },
      child2 = { id: 'child2', parent: parent1 },
      child3 = { id: 'child3', parent: parent1 },
      parent2 = { id: 'parent2', parent: root },
      child4 = { id: 'child4', parent: parent2 },
      child5 = { id: 'child5', parent: parent2 },
      grandChild1 = { id: 'grandChild1', parent: child5 };

  describe('#getParents', function() {

    it('should get parents', function() {

      // when
      var parents = getParents([
        parent1,
        child1,
        child2,
        child3,
        parent2,
        child4,
        child5,
        grandChild1
      ]);

      // then
      expect(parents).to.eql([
        parent1,
        parent2
      ]);
    });


    it('should get parents', function() {

      // when
      var parents = getParents([
        child1,
        child2,
        child3,
        child4,
        child5,
        grandChild1
      ]);

      // then
      expect(parents).to.eql([
        child1,
        child2,
        child3,
        child4,
        child5
      ]);
    });

  });

});
