import uniqid from 'uniqid';
import { GROUP_DEFAULT_TITLE, RESOURCE_DEFAULT_TITLE } from 'app/constants/defaults';

import { get, htmlFromText } from './index';

import categories from './categories';
import refactorSource, { refactorMessage } from './refactorAction';
import { createHash, combineHashes, createRoute, combineRoutes } from './hash';

const groupForStandaloneResources = {
  element: 'category',
  content: [],
  title: GROUP_DEFAULT_TITLE,
  hash: createHash(GROUP_DEFAULT_TITLE),
  route: createRoute(GROUP_DEFAULT_TITLE),
};

const parseSourceFile = ({ content }) => {
  const [error, warnings] = detectErrorsAndWarnings(content);

  if (error) {
    return {
      topLevelMeta: {
        error,
        warnings,
      },
    };
  }

  const source = content[0];
  const resources = [];
  const actions = [];

  const topLevelDescription = source.content.find(i => i.element === 'copy');
  const topLevelDescriptionElement = topLevelDescription ? htmlFromText(topLevelDescription.content) : null;
  const topLevelContentItems = source.content;

  const topLevelMeta = {
    title: get('meta', 'title', 'content').from(source),
    description: topLevelDescriptionElement,
    host: getHost(),
    warnings,
  };

  Object.values(categories).forEach(itemArray => {
    if (itemArray.length > 0) itemArray.length = 0;
  });

  topLevelContentItems.forEach(item => {
    if (item.element === 'category') {
      const categoryType = Array.isArray(item.meta.classes)
        ? item.meta.classes[0]
        : item.meta.classes.content[0].content;

      categories[`${categoryType}Array`].push(item);
    }

    if (item.element === 'resource') {
      groupForStandaloneResources.content.push(item);
    }
  });

  if (categories.dataStructuresArray.length > 0) {
    categories.dataStructuresArray = categories.dataStructuresArray.reduce((res, dsItem) => {
      res.push(...dsItem.content);
      return res;
    }, []);
  }

  if (categories.schemaStructuresArray.length > 0) {
    categories.schemaStructuresArray = categories.schemaStructuresArray.reduce((res, ssItem) => {
      res.push(...ssItem.content);
      return res;
    }, []);
  }

  if (groupForStandaloneResources.content.length > 0) {
    categories.resourceGroupArray.unshift(groupForStandaloneResources);
  }

  const groups = categories.resourceGroupArray.map((group, gIndex) => {
    const groupTitle = get('meta', 'title', 'content').from(group) || `${GROUP_DEFAULT_TITLE} ${gIndex}`;
    const groupHash = createHash(groupTitle);
    const groupRoute = createRoute(groupTitle);
    const groupMeta = {
      title: groupTitle,
      hash: groupHash,
      route: groupRoute,
    };

    group.hash = groupHash;
    group.route = groupRoute;
    group.title = groupTitle;

    group.content = group.content.map((groupChild, rIndex) => {
      if (groupChild.element === 'copy') return groupChild;

      const resourceTitle = get('meta', 'title', 'content').from(groupChild) || `${RESOURCE_DEFAULT_TITLE} ${rIndex}`;
      const resourceHref = get('attributes', 'href', 'content').from(groupChild);
      const resourceHash = combineHashes(groupHash, createHash(resourceTitle));
      const resourceRoute = combineRoutes(groupRoute, createRoute(resourceTitle));

      groupChild.hash = resourceHash;
      groupChild.route = resourceRoute;
      groupChild.title = resourceTitle;


      if (groupChild.element === 'message') {
        const message = refactorMessage(groupChild);
        message.id = uniqid.time();
        message.parentGroup = groupMeta;
        resources.push(message);
        return message;
      }

      groupChild.content = groupChild.content.map(resourceChild => {
        if (resourceChild.element === 'copy') return resourceChild;
        if (!resourceChild.attributes) {
          resourceChild.attributes = {};
        }

        resourceChild.attributes = { ...groupChild.attributes, ...resourceChild.attributes };
        resourceChild.id = uniqid.time();

        const action = refactorSource(resourceChild);

        action.hash = combineHashes(resourceHash, action.hash);
        action.route = combineRoutes(resourceRoute, action.route);
        action.parentResource = {
          title: resourceTitle,
          href: resourceHref,
          hash: resourceHash,
          route: resourceRoute,
          group: groupMeta,
        };
        actions.push(action);
        return action;
      });

      groupChild.parentGroup = groupMeta;

      resources.push(groupChild);
      return groupChild;
    });

    return group;
  });

  return {
    topLevelMeta,
    groups,
    resources,
    actions,
  };
};

export default parseSourceFile;

function detectErrorsAndWarnings(content) {
  let eAnnotation;
  const warnings = [];
  const annotationType = (source) => get('meta', 'classes', 'content', '0', 'content').from(source);
  const isAnnotationOfType = (item, type) => {
    if (item.element !== 'annotation') return false;
    return annotationType(item) === type;
  };
  content.forEach(item => {
    if (isAnnotationOfType(item, 'error')) {
      eAnnotation = item;
      return;
    }
    if (isAnnotationOfType(item, 'warning')) {
      warnings.push(item);
    }
  });

  const consumableWarnings = warnings.map(extractAnnotationInfo);

  if (!eAnnotation) {
    return [undefined, consumableWarnings];
  }

  const consumableError = extractAnnotationInfo(eAnnotation);

  return [consumableError, consumableWarnings];
}

function extractAnnotationInfo(annotation) {
  const text = annotation.content;
  const sourceMap = annotation.attributes.sourceMap.content[0];
  const startPositionSourceMap = sourceMap.content[0];
  const sourceFile = sourceMap.file;
  const positionAttributes = startPositionSourceMap.content[0].attributes;
  const positionDetails = {
    line: positionAttributes.line.content,
    column: positionAttributes.column.content,
    file: sourceFile,
  };
  return { text, details: positionDetails, id: uniqid.time() };
}

function getHost(source) {
  const metadata = get('attributes', 'metadata', 'content').from(source);
  const hostMetaElement = metadata && metadata.find(item => item.content.key.content === 'HOST');
  return hostMetaElement ? hostMetaElement.content.value.content : null;
}
