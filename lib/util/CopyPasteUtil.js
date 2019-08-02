import {
  filter,
  find
} from 'min-dash';

/**
 * Get parent elements.
 *
 * @param {Array<djs.model.base>} elements
 *
 * @returns {Array<djs.model.Base>}
 */
export function getParents(elements) {

  // find elements that are not children of any other elements
  return filter(elements, function(element) {
    return !find(elements, function(e) {
      return e !== element && getParent(element, e);
    });
  });
}

function getParent(element, parent) {
  if (!parent) {
    return;
  }

  if (element === parent) {
    return parent;
  }

  if (!element.parent) {
    return;
  }

  return getParent(element.parent, parent);
}