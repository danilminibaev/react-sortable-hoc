let lol = {};
// by X
export const willNodeMovePastRightBorder = (
  node,
  container,
  transitionData,
) => {
  const {edgeOffset, translate} = transitionData;
  if (
    edgeOffset.left + translate.x + node.clientWidth >=
    container.offsetWidth
  ) {
    if (!lol[`${node.innerText}`]) {
      lol = {...lol, ...{[`${node.innerText}`]: 1}};
    } else {
      lol[`${node.innerText}`] = lol[`${node.innerText}`] + 1;
    }

    if (lol[`${node.innerText}`] === 1 || lol[`${node.innerText}`] === 10) {
      console.log(
        node.innerText,
        '~~~~~~',
        lol[`${node.innerText}`],
        translate,
      );
    }
    // console.log(
    //   'we can expect node',
    //   node.innerText,
    //   ' to be moved out of the right border',
    // );
  }
  return (
    edgeOffset.left + translate.x + node.clientWidth >= container.offsetWidth
  );
};

export const willNodeMovePastLeftBorder = (node, container, transitionData) => {
  const {edgeOffset, translate} = transitionData;
  // if (edgeOffset.left + translate.x <= 0) {
  //   debugger;
  //   console.log(
  //     'we can expect node',
  //     node.innerText,
  //     ' to be moved out of the left border',
  //   );
  // }
  return edgeOffset.left + translate.x <= 0;
};

export const getUpdatedOffsets = (
  nodeObject,
  transitionData,
  gap,
  direction = 'x',
) => {
  const {node} = nodeObject;
  const {translate} = transitionData;
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

let i = {};

export const onNodeDownForward = (targetOffset, nodeToMove, gap) => {
  const {edgeOffset} = nodeToMove;

  const translate = {
    x: targetOffset.left - edgeOffset.left,
    y: targetOffset.top - edgeOffset.top,
  };

  // nodeToMove.translate = translate;
  // nodeToMove.edgeOffset = targetOffset;

  // // considering that the node is now shifted, so as the starting offset for the next one to move
  // const nextPositionOffset = getUpdatedOffsets(nodeToMove, gap);

  if (!i[`${nodeToMove.node.innerText}`]) {
    i = {...i, ...{[`${nodeToMove.node.innerText}`]: 1}};
  } else {
    i[`${nodeToMove.node.innerText}`] = i[`${nodeToMove.node.innerText}`] + 1;
  }

  // console.log(
  //   `NODE ${
  //     nodeToMove.node.innerText
  //   } will be moved down and forward in relation to ${JSON.stringify(
  //     targetOffset,
  //   )} \n for the time:${i[`${nodeToMove.node.innerText}`]}`,
  // );

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

  if (nodesToShift.length) {
  }

  for (let i = 0, len = nodesToShift.length; i < len; i++) {
    const newOffsets =
      i === 0
        ? getUpdatedOffsets(
            startPointNode,
            {
              translate: startPointNode.translate
                ? startPointNode.translate
                : {x: 0, y: 0},
            },
            gap,
          )
        : getUpdatedOffsets(
            nodesToShift[i - 1],
            {
              translate: nodesToShift[i - 1].translate
                ? nodesToShift[i - 1].translate
                : {x: 0, y: 0},
            },
            gap,
          );

    const extraTranslate = {
      x: newOffsets.left - nodesToShift[i].edgeOffset.left,
      y: newOffsets.top - nodesToShift[i].edgeOffset.top,
    };

    const {x: XX, y: YY} = nodesToShift[i].translate
      ? nodesToShift[i].translate
      : {x: 0, y: 0};

    const nodeUpdatedTranslate = {
      x: XX + extraTranslate.x,
      y: YY + extraTranslate.y,
    };

    nodesToShift[i].edgeOffset = newOffsets;
    nodesToShift[i].translate = nodeUpdatedTranslate;

    if (
      willNodeMovePastRightBorder(
        nodesToShift[i].node,
        container,
        nodesToShift[i],
      )
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
      debugger;
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
