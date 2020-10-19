export const isNodeOutOfRightBorder = (node, container, transitionData) => {
  const {edgeOffset, translate} = transitionData;
  return (
    edgeOffset.left + translate.x + node.clientWidth > container.offsetWidth
  );
};

export const getUpdatedOffsets = (nodeObject, gap, direction = 'x') => {
  const {node, translate} = nodeObject;
  const extraX = direction.includes('x') ? node.offsetWidth + gap.x : 0;
  const extraY = direction.includes('y') ? node.offsetHeight + gap.y : 0;

  return {
    left: node.offsetLeft + translate.x + extraX,
    top: node.offsetTop + translate.y + extraY,
  };
};

// considering just offsets due to translate might take time
const willNodesOverlap = (nodeObject1, nodeObject2) => {
  const {edgeOffset: edgeOffset1, node: nodeEl1} = nodeObject1;
  const {edgeOffset: edgeOffset2, node: nodeEl2} = nodeObject2;

  const right1 = edgeOffset1.left + nodeEl1.offsetWidth;
  const right2 = edgeOffset2.left + nodeEl2.offsetWidth;
  const bottom1 = edgeOffset1.top + nodeEl1.offsetHeight;
  const bottom2 = edgeOffset2.top + nodeEl2.offsetHeight;

  return !(
    right1 < edgeOffset2.left ||
    edgeOffset1.left > right2 ||
    bottom1 < edgeOffset2.top ||
    edgeOffset1.top > bottom2
  );
};

export const getNodeNeighboursToMoveRightDown = (currentNode, allNodes) => {
  const nodeOverlapped = allNodes
    .filter(({node}) => currentNode.node !== node)
    .filter((node) => node.edgeOffset.top === currentNode.edgeOffset.top)
    .find((node) => willNodesOverlap(currentNode, node));

  if (nodeOverlapped) {
    debugger;
    return [
      nodeOverlapped,
      ...allNodes
        .filter(
          (node) =>
            node.edgeOffset.top === currentNode.edgeOffset.top &&
            node.edgeOffset.left > currentNode.edgeOffset.left,
        )
        .filter(({node}) => nodeOverlapped.node !== node),
    ];
  }
  return [];
};

export const onNodeDownForward = (startOffset, gap) => (nodeToMove) => {
  const {edgeOffset} = nodeToMove;

  const translate = {
    x: startOffset.left - edgeOffset.left,
    y: startOffset.top - edgeOffset.top,
  };

  nodeToMove.translate = translate;
  nodeToMove.edgeOffset = startOffset;

  // considering that the node is now shifted, so as the starting offset for the next one to move
  startOffset = getUpdatedOffsets(nodeToMove, gap);

  return translate;
};

export const getTranslateOnNodesMovingRightDown = (
  startPointNode,
  allNodes,
  container,
  gap,
  rightSideNodes,
) => {
  const nodesToShift = rightSideNodes.concat(
    allNodes.filter(
      (node) => node.edgeOffset.top > startPointNode.edgeOffset.top,
    ),
  );

  for (let i = 0, len = nodesToShift.length; i < len; i++) {
    const newOffsets =
      i === 0
        ? getUpdatedOffsets(startPointNode, gap)
        : getUpdatedOffsets(nodesToShift[i - 1], gap);

    const extraTranslate = {
      x: newOffsets.left - nodesToShift[i].edgeOffset.left,
      y: newOffsets.top - nodesToShift[i].edgeOffset.top,
    };

    const nodeUpdatedTranslate = {
      x: nodesToShift[i].translate.x + extraTranslate.x,
      y: nodesToShift[i].translate.y + extraTranslate.y,
    };

    nodesToShift[i].edgeOffset = newOffsets;
    nodesToShift[i].translate = nodeUpdatedTranslate;

    if (
      isNodeOutOfRightBorder(nodesToShift[i].node, container, nodesToShift[i])
    ) {
      const nextRowOffset =
        i + 1 < len
          ? nodesToShift[i + 1].edgeOffset
          : nodesToShift[i].edgeOffset;

      const nodeTranslateToNextRow = {
        x: nextRowOffset.left - nodesToShift[i].edgeOffset.left,
        y: nextRowOffset.top - nodesToShift[i].edgeOffset.top,
      };

      nodesToShift[i].translate = {
        x: nodesToShift[i].translate.x + nodeTranslateToNextRow.x,
        y: nodesToShift[i].translate.y + nodeTranslateToNextRow.y,
      };

      nodesToShift[i].edgeOffset = nextRowOffset;
    }
  }
};

// 'fromNode' - node in relation to we make calculations
// export const bulkMoveNodesToTheRightDown = (
//   fromNode,
//   allNodes,
//   container,
//   gap,
//   rightSideNodes,
// ) => {
//   // const nodesToMove = allNodes.filter((node) => {
//   //   if (node.edgeOffset.top < fromNode.edgeOffset.top) {
//   //     return false;
//   //   }
//   //   // if on the next row
//   //   if (node.edgeOffset.top > fromNode.edgeOffset.top) {
//   //     return true;
//   //   }
//   //   // on the same row but on right side
//   //   if (
//   //     node.edgeOffset.top === fromNode.edgeOffset.top &&
//   //     node.edgeOffset.left > fromNode.edgeOffset.left
//   //   ) {
//   //     return true;
//   //   }
//   //   // or if overlaps
//   //   return areNodesOverlapping(fromNode.node, node.node);
//   // });

//   const nodesToMove = rightSideNodes.concat(
//     allNodes.filter((node) => node.edgeOffset.top > fromNode.edgeOffset.top),
//   );

//   if (nodesToMove.length) {
//      //console.log(nodesToMove.map((n) => n.node.innerText));
//   }
//   const calcOffset = (byNode) => ({
//     left: byNode.edgeOffset.left + byNode.node.offsetWidth + gap.x,
//     top: byNode.edgeOffset.top,
//   });

//   for (let i = 0, len = nodesToMove.length; i < len; i++) {
//     const translate = {x: 0, y: 0};
//     const offset =
//       i === 0 ? calcOffset(fromNode) : calcOffset(nodesToMove[i - 1]);

//     translate.y = offset.top - nodesToMove[i].edgeOffset.top;
//     translate.x = offset.left - nodesToMove[i].edgeOffset.left;

//     const cacheOffset = {...nodesToMove[i].edgeOffset};
//     //const cacheTranslate =
//      //console.log('TR', nodesToMove[i].translate);

//     nodesToMove[i].translate = {
//       x: nodesToMove[i].translate.x + translate.x,
//       y: nodesToMove[i].translate.y + translate.y,
//     };
//     nodesToMove[i].edgeOffset = {...offset};

//     // then checking if the element is about to go out of the border
//     if (
//       isNodeOutOfRightBorder(nodesToMove[i].node, container, nodesToMove[i])
//     ) {
//       // then we need to move node on the next row below
//       const nextRowOffset = nodesToMove[i + 1]
//         ? nodesToMove[i + 1].edgeOffset
//         : {
//             left:
//               nodesToMove[i].edgeOffset.left +
//               nodesToMove[i].node.offsetWidth +
//               gap.x,
//             top: nodesToMove[i].edgeOffset.top,
//           };
//       translate.x = nextRowOffset.left - nodesToMove[i].edgeOffset.left;
//       translate.y = nextRowOffset.top - nodesToMove[i].edgeOffset.top;
//        //console.log(nodesToMove[i].translate);

//       nodesToMove[i].translate = {
//         x: nodesToMove[i].translate.x + translate.x,
//         y: nodesToMove[i].translate.y + translate.y,
//       };
//       nodesToMove[i].edgeOffset = {...nextRowOffset};
//     }

//     setTranslate3d(nodesToMove[i].node, nodesToMove[i].translate);
//     debugger;
//   }
// };
