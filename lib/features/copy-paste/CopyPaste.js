import {
  assign,
  find,
  findIndex,
  forEach,
  isArray,
  isNumber,
  map,
  matchPattern,
  omit,
  sortBy
} from 'min-dash';

import { getBBox } from '../../util/Elements';

import {
  center,
  delta as posDelta
} from '../../util/PositionUtil';

import {
  getTopLevel
} from '../../util/CopyPasteUtil';

import {
  eachElement
} from '../../util/Elements';

import Elements from '../create/Elements';


export default function CopyPaste(
    canvas,
    create,
    clipboard,
    elementFactory,
    eventBus,
    modeling,
    mouseTracking,
    rules
) {

  this._canvas = canvas;
  this._create = create;
  this._clipboard = clipboard;
  this._elementFactory = elementFactory;
  this._eventBus = eventBus;
  this._modeling = modeling;
  this._mouseTracking = mouseTracking;
  this._rules = rules;

  eventBus.on('elements.paste', function(context) {
    var hints = context.hints;

    assign(hints, {
      behavior: false
    });
  });

  this._descriptors = [];


  // Element creation priorities:
  // - 1: Independent shapes
  // - 2: Attached shapes
  // - 3: Connections
  // - 4: labels
  this.registerDescriptor(function(element, descriptor, includedElements) {
    // Base priority
    descriptor.priority = 1;

    descriptor.id = element.id;

    var parentCopied = find(includedElements, function(e) {
      return e.element === element.parent;
    });

    // do NOT reference parent if parent wasn't copied
    if (parentCopied) {
      descriptor.parent = element.parent.id;
    }

    if (element.labelTarget) {
      // Labels priority
      descriptor.priority = 4;
      descriptor.labelTarget = element.labelTarget.id;
    }

    if (element.host) {
      // Attached shapes priority
      descriptor.priority = 2;
      descriptor.host = element.host.id;
    }

    if (typeof element.x === 'number') {
      descriptor.x = element.x;
      descriptor.y = element.y;
    }

    if (element.width) {
      descriptor.width = element.width;
      descriptor.height = element.height;
    }

    if (element.waypoints) {
      // Connections priority
      descriptor.priority = 3;
      descriptor.waypoints = [];

      forEach(element.waypoints, function(waypoint) {
        var wp = {
          x: waypoint.x,
          y: waypoint.y
        };

        if (waypoint.original) {
          wp.original = {
            x: waypoint.original.x,
            y: waypoint.original.y
          };
        }

        descriptor.waypoints.push(wp);
      });
    }

    if (element.source && element.target) {
      descriptor.source = element.source.id;
      descriptor.target = element.target.id;
    }

    return descriptor;
  });
}

CopyPaste.$inject = [
  'canvas',
  'create',
  'clipboard',
  'elementFactory',
  'eventBus',
  'modeling',
  'mouseTracking',
  'rules'
];


/**
 * Copy a number of elements.
 *
 * @param {djs.model.Base} selectedElements
 *
 * @return {Object} the copied tree
 */
CopyPaste.prototype.copy = function(selectedElements) {
  var clipboard = this._clipboard,
      tree, bbox;

  if (!isArray(selectedElements)) {
    selectedElements = selectedElements ? [ selectedElements ] : [];
  }

  if (!selectedElements.length) {
    return;
  }

  tree = this.createTree(selectedElements);

  bbox = this._bbox = center(getBBox(tree.allShapes));

  // not needed after computing the center position of the copied elements
  delete tree.allShapes;

  forEach(tree, function(elements) {

    forEach(elements, function(element) {
      var delta, labelTarget;

      // set label's relative position to their label target
      if (element.labelTarget) {
        labelTarget = find(elements, matchPattern({ id: element.labelTarget }));

        // just grab the delta from the first waypoint
        if (labelTarget.waypoints) {
          delta = posDelta(element, labelTarget.waypoints[0]);
        } else {
          delta = posDelta(element, labelTarget);
        }

      } else
      if (element.priority === 3) {
        // connections have priority 3
        delta = [];

        forEach(element.waypoints, function(waypoint) {
          var waypointDelta = posDelta(waypoint, bbox);

          delta.push(waypointDelta);
        });
      } else {
        delta = posDelta(element, bbox);
      }

      element.delta = delta;
    });
  });

  this._eventBus.fire('elements.copy', { context: { tree: tree } });

  // if tree is empty, means that nothing can be or is allowed to be copied
  if (Object.keys(tree).length === 0) {
    clipboard.clear();
  } else {
    clipboard.set(tree);
  }

  this._eventBus.fire('elements.copied', { context: { tree: tree } });

  return tree;
};

/**
 * Paste elements.
 *
 * @param {Object} [context]
 * @param {djs.model.base} [context.element] - Parent.
 * @param {Point} [context.point] - Position.
 */
CopyPaste.prototype.paste = function(context) {
  var tree = this._clipboard.get();

  if (this._clipboard.isEmpty()) {
    return;
  }

  var hints = {};

  this._eventBus.fire('elements.paste', {
    hints: hints
  });

  var elements = this._createElements(tree);

  // paste directly
  if (context && context.element && context.point) {
    return this._paste(elements, context.element, context.point, hints);
  }

  this._create.start(this._mouseTracking.getLastEvent('mousemove'), elements, {
    hints: hints || {}
  });
};

/**
 * Paste elements directly.
 *
 * @param {Elements} elements
 * @param {djs.model.base} target
 * @param {Point} position
 * @param {Object} [hints]
 */
CopyPaste.prototype._paste = function(elements, target, position, hints) {

  // make sure each element has x and y
  elements.forEach(function(element) {
    if (!isNumber(element.x)) {
      element.x = 0;
    }

    if (!isNumber(element.y)) {
      element.y = 0;
    }
  });

  var bbox = getBBox(elements.getAll());

  // center elements around cursor
  elements.forEach(function(element) {
    if (isConnection(element)) {
      element.waypoints = map(element.waypoints, function(waypoint) {
        return {
          x: waypoint.x - bbox.x - bbox.width / 2,
          y: waypoint.y - bbox.y - bbox.height / 2
        };
      });
    }

    assign(element, {
      x: element.x - bbox.x - bbox.width / 2,
      y: element.y - bbox.y - bbox.height / 2
    });
  });

  return this._modeling.createElements(elements, position, target, assign({}, hints));
};

/**
 * Create elements from tree.
 */
CopyPaste.prototype._createElements = function(tree) {
  var self = this;

  var eventBus = this._eventBus;

  var cache = {};

  var elements = new Elements();

  forEach(tree, function(branch, depth) {

    depth = parseInt(depth, 10);

    // sort by priority
    branch = sortBy(branch, 'priority');

    forEach(branch, function(descriptor) {

      // remove priority
      var attrs = assign({}, omit(descriptor, [ 'priority' ]));

      if (cache[ descriptor.parent ]) {
        attrs.parent = cache[ descriptor.parent ];
      } else {
        delete attrs.parent;
      }

      eventBus.fire('element.paste', {
        cache: cache,
        descriptor: attrs
      });

      var element;

      if (isConnection(attrs)) {
        attrs.source = cache[ descriptor.source ];
        attrs.target = cache[ descriptor.target ];

        element = cache[ descriptor.id ] = self.createConnection(attrs);

        elements.add(element);

        return;
      }

      if (isLabel(attrs)) {
        attrs.labelTarget = cache[ attrs.labelTarget ];

        element = cache[ descriptor.id ] = self.createLabel(attrs);

        elements.add(element);

        return;
      }

      if (attrs.host) {
        attrs.host = cache[ attrs.host ];
      }

      element = cache[ descriptor.id ] = self.createShape(attrs);

      elements.add(element);
    });

  });

  return elements;
};

CopyPaste.prototype.createConnection = function(attrs) {
  var connection = this._elementFactory.createConnection(omit(attrs, [ 'id' ]));

  return connection;
};

CopyPaste.prototype.createLabel = function(attrs) {
  var label = this._elementFactory.createLabel(omit(attrs, [ 'id' ]));

  return label;
};

CopyPaste.prototype.createShape = function(attrs) {
  var shape = this._elementFactory.createShape(omit(attrs, [ 'id' ]));

  return shape;
};

CopyPaste.prototype._computeDelta = function(elements, element) {
  var bbox = this._bbox,
      delta = {};

  // set label's relative position to their label target
  if (element.labelTarget) {
    return posDelta(element, element.labelTarget);
  }

  // connections have prority 3
  if (element.priority === 3) {
    delta = [];

    forEach(element.waypoints, function(waypoint) {
      var waypointDelta = posDelta(waypoint, bbox);

      delta.push(waypointDelta);
    });
  } else {
    delta = posDelta(element, bbox);
  }

  return delta;
};


/**
 * Checks if the element in question has a relations to other elements.
 * Possible dependants: connections, labels, attachers
 *
 * @param  {Array} elements
 * @param  {Object} element
 *
 * @return {Boolean}
 */
CopyPaste.prototype.hasRelations = function(elements, element) {
  var source, target, labelTarget;

  if (element.waypoints) {
    source = find(elements, matchPattern({ id: element.source.id }));
    target = find(elements, matchPattern({ id: element.target.id }));

    if (!source || !target) {
      return false;
    }
  }

  if (element.labelTarget) {
    labelTarget = find(elements, matchPattern({ id: element.labelTarget.id }));

    if (!labelTarget) {
      return false;
    }
  }

  return true;
};


CopyPaste.prototype.registerDescriptor = function(descriptor) {
  if (typeof descriptor !== 'function') {
    throw new Error('the descriptor must be a function');
  }

  if (this._descriptors.indexOf(descriptor) !== -1) {
    throw new Error('this descriptor is already registered');
  }

  this._descriptors.push(descriptor);
};


CopyPaste.prototype._executeDescriptors = function(data, includedElements) {
  if (!data.descriptor) {
    data.descriptor = {};
  }

  forEach(this._descriptors, function(descriptor) {
    data.descriptor = descriptor(data.element, data.descriptor, includedElements);
  });

  return data;
};

/**
 * Creates a tree like structure from an arbitrary collection of elements
 *
 * @example
 * tree: {
 *	0: [
 *		{ id: 'shape_12da', priority: 1, ... },
 *		{ id: 'shape_01bj', priority: 1, ... },
 *		{ id: 'connection_79fa', source: 'shape_12da', target: 'shape_01bj', priority: 3, ... },
 *	],
 *	1: [ ... ]
 * };
 *
 * @param  {Array} elements
 * @return {Object}
 */
CopyPaste.prototype.createTree = function(elements) {
  var rules = this._rules,
      self = this;

  var tree = {},
      includedElements = [],
      _elements;

  var topLevel = getTopLevel(elements);

  tree.allShapes = [];

  function canCopy(elements, element) {
    return rules.allowed('element.copy', {
      element: element,
      elements: elements
    });
  }

  function includeElement(data) {
    var idx = findIndex(includedElements, matchPattern({ element: data.element })),
        element;

    if (idx !== -1) {
      element = includedElements[idx];
    } else {
      return includedElements.push(data);
    }

    // makes sure that it has the correct depth
    if (element.depth < data.depth) {
      includedElements.splice(idx, 1);

      includedElements.push(data);
    }
  }


  eachElement(topLevel, function(element, i, depth) {
    var nestedChildren = element.children;

    // don't add labels directly
    if (element.labelTarget) {
      return;
    }

    function getNested(lists) {
      forEach(lists, function(list) {
        if (list && list.length) {

          forEach(list, function(elem) {

            forEach(elem.labels, function(label) {
              includeElement({
                element: label,
                depth: depth
              });
            });

            includeElement({
              element: elem,
              depth: depth
            });
          });
        }
      });
    }

    // fetch element's labels
    forEach(element.labels, function(label) {

      includeElement({
        element: label,
        depth: depth
      });
    });

    getNested([ element.attachers, element.incoming, element.outgoing ]);

    includeElement({
      element: element,
      depth: depth
    });

    if (nestedChildren) {
      return nestedChildren;
    }
  });

  includedElements = map(includedElements, function(data) {
    // this is where other registered descriptors hook in
    return self._executeDescriptors(data, includedElements);
  });

  // order the elements to check if the ones dependant on others (by relationship)
  // can be copied. f.ex: label needs it's label target
  includedElements = sortBy(includedElements, function(data) {
    return data.descriptor.priority;
  });

  _elements = map(includedElements, function(data) {
    return data.element;
  });

  forEach(includedElements, function(data) {
    var depth = data.depth;

    if (!self.hasRelations(tree.allShapes, data.element)) {
      return;
    }

    if (!canCopy(_elements, data.element)) {
      return;
    }

    tree.allShapes.push(data.element);

    // create depth branches
    if (!tree[depth]) {
      tree[depth] = [];
    }

    tree[depth].push(data.descriptor);
  });

  return tree;
};

// helpers //////////

function isConnection(element) {
  return !!element.waypoints;
}

function isLabel(element) {
  return !!element.labelTarget;
}
