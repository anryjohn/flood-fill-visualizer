"use client"
import React, { useState, useEffect } from 'react';
import { useSpring, useSprings, animated } from '@react-spring/web'

export default function FloodFill() {
  const [algorithm, setAlgorithm] = useState('BFS');
  const [rows, setRows] = useState(5);
  const [cols, setCols] = useState(5);
  const [numBlkdTiles, setNumBlkdTiles] = useState(5);
  const [sr, setStartRow] = useState(0);
  const [sc, setStartCol] = useState(0);
  const [cr, setCurrentRow] = useState(-1);
  const [cc, setCurrentCol] = useState(-1);
  const [selectedTile, setSelectedTile] = useState({ row: null, col: null });
  const [image, setImage] = useState([]);
  const [floodFillState, setFloodFillState] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [orderStructure, setOrderStructure] = useState([]);
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    setImage(generateRandomGrid(rows, cols, numBlkdTiles));
  }, [rows, cols, numBlkdTiles]);

  const handleInitialize = () => {
    if (sr >= 0 && sr < rows && sc >= 0 && sc < cols) {
      const initialState = initializeFloodFill(image, sr, sc, [0, 1]);
      if (initialState) {
        setFloodFillState(initialState);
        setIsInitialized(true);
        const newOrderStructure = algorithm === 'BFS' ? [...initialState.queue] : [...initialState.stack];
        setOrderStructure(newOrderStructure);
        setSteps([`${algorithm === 'BFS' ? 'Pushed' : 'Placed'} first tile ${algorithm === 'BFS' ? 'into the queue' : ' atop the stack'}.`])
      }
    } else {
      alert("Starting coordinates are out of bounds.");
    }
  };

  const getCurrentTile = () => {
    if (orderStructure.length === 0) return [-1, -1];
    if (algorithm === 'BFS') return orderStructure[0];
    else return orderStructure[orderStructure.length - 1];
  };

  const handleStep = () => {
    if (floodFillState) {

      // Update current tile before processing the step
      const [nextRow, nextCol] = getCurrentTile();
      setCurrentRow(nextRow);
      setCurrentCol(nextCol);

      const nextState = algorithm === 'BFS' 
        ? floodFillStepBFS(floodFillState)
        : floodFillStepDFS(floodFillState);
      if (nextState) {
        setFloodFillState(nextState);
        setImage([...nextState.image]);
        setOrderStructure(algorithm === 'BFS' ? [...nextState.queue] : [...nextState.stack]);

        // Add a step to the explanation
        setSteps(prevSteps => [
          ...prevSteps,
          `${algorithm === 'BFS' ? 'Shifted' : 'Popped'} tile (${nextRow}, ${nextCol}) from ${algorithm === 'BFS' ? 'queue' : 'stack'} and flooded it.`
        ]);

        // If new tiles were added to the queue/stack, mention it
        const newTiles = algorithm === 'BFS' 
          ? nextState.queue.filter(tile => !orderStructure.some(t => t[0] === tile[0] && t[1] === tile[1]))
          : nextState.stack.filter(tile => !orderStructure.some(t => t[0] === tile[0] && t[1] === tile[1]));
      
        if (newTiles.length > 0) {
          setSteps(prevSteps => [
            ...prevSteps,
            `Added ${newTiles.length} new neighboring tile${newTiles.length > 1 ? 's' : ''} to the ${algorithm === 'BFS' ? 'queue' : 'stack'}.`
          ]);
        } else {
          setSteps(prevSteps => [
            ...prevSteps,
            `No non-flooded, non-blocked neighboring tiles to (${nextRow}, ${nextCol}) found.`
          ]);
        }
      } else {
        setIsComplete(true);
        setSteps(prevSteps => [...prevSteps, "Algorithm completed. All reachable tiles have been filled."]);
      }
    }
  };

  const resetTiles = (r, c, bts) => {
    setImage(generateRandomGrid(r, c, bts));
    setFloodFillState(null); // Reset flood fill state
    setSelectedTile({ row: null, col: null }); // Reset selected tile
    setIsInitialized(false); // Reset button visibility on reset
    setIsComplete(false); // Ensure "Next Step" is re-enabled
    setOrderStructure([]); // Clear the queue/stack
    setCurrentRow(-1);
    setCurrentCol(-1);
    setSteps([]);
  }

  const handleReset = () => {
    resetTiles(rows, cols, numBlkdTiles);
  };

  const handleRowsChange = (event) => {
    const newRows = parseInt(event.target.value);
    if(numBlkdTiles >= newRows * cols) {
      const newBlkdTiles = newRows * cols - 1;
      setNumBlkdTiles(newBlkdTiles);
    }
    setRows(newRows);
    resetTiles(newRows, cols, numBlkdTiles);
    if (sr >= newRows) setStartRow(newRows - 1);
  };

  const handleColsChange = (event) => {
    const newCols = parseInt(event.target.value);
    if(numBlkdTiles >= newCols * rows) {
      const newBlkdTiles = newCols * rows - 1;
      setNumBlkdTiles(newBlkdTiles);
    }
    setCols(newCols);
    resetTiles(rows, newCols, numBlkdTiles);
    if (sc >= newCols) setStartCol(newCols - 1);
  };

  const handleBlkdTilesChange = (event) => {
    const newBlkdTiles = parseInt(event.target.value);
    setNumBlkdTiles(newBlkdTiles);
    resetTiles(rows, cols, newBlkdTiles);
  };

  const handleTileClick = (rowIndex, colIndex) => {
    if (!isInitialized && image[rowIndex][colIndex] === 0) {
      setStartRow(rowIndex);
      setStartCol(colIndex);
      setSelectedTile({ row: rowIndex, col: colIndex });
    }
  };

  // Creates the visual that allows alternating between BFS and DFS
  const AlgorithmSelector = () => {
    const isDFSMode = algorithm === 'DFS';

    const { transform, opacity } = useSpring({
      opacity: isDFSMode ? 1 : 0,
      transform: `perspective(600px) rotateX(${isDFSMode ? 180 : 0}deg)`,
      config: { mass: 5, tension: 500, friction: 80 },
    });
  
    const handleClick = () => {
      setAlgorithm(isDFSMode ? 'BFS' : 'DFS');
      resetTiles(rows, cols, numBlkdTiles);
    };
  
    return (
      <div onClick={handleClick} className="relative inline-block w-20 h-12 mb-2 cursor-pointer align-middle">
        <animated.div
          className="absolute w-full h-full flex items-center justify-center bg-blue-400 text-white rounded"
          style={{
            opacity: opacity.to(o => 1 - o),
            transform,
            rotateX: '0deg',
          }}
        >
          BFS
        </animated.div>
        <animated.div
          className="absolute w-full h-full flex items-center justify-center bg-purple-400 text-white rounded"
          style={{
            opacity,
            transform,
            rotateX: '180deg',
          }}
        >
          DFS
        </animated.div>
      </div>
    );
  };

  // Builds the sliders that can alter grid dimensions and number of non-accessible tiles
  const gridControlsDisplay = () => {
    const controlStyles = "flex flex-col items-center pb-10";
    const labelStyles = "mb-1 text-xl font-extrabold";
    const inputStyles = "w-64";
  
    const controls = [
      {
        label: "Rows",
        value: rows,
        onChange: handleRowsChange,
        min: 3,
        max: 10,
        accentColor: "accent-blue-300"
      },
      {
        label: "Columns",
        value: cols,
        onChange: handleColsChange,
        min: 3,
        max: 10,
        accentColor: "accent-purple-300"
      },
      {
        label: "Blocked Tiles",
        value: numBlkdTiles,
        onChange: handleBlkdTilesChange,
        min: 0,
        max: rows * cols - 1,
        accentColor: "accent-gray-400"
      }
    ];
  
    return (
      <div>
        {controls.map((control, index) => (
          <div key={index} className={controlStyles}>
            <label className={labelStyles}>
              {control.label}: {control.value}
            </label>
            <input
              type="range"
              min={control.min}
              max={control.max}
              value={control.value}
              onChange={control.onChange}
              className={`${inputStyles} ${control.accentColor}`}
            />
          </div>
        ))}
      </div>
    );
  };

  // Generates the interactive grid
  const InteractiveGridDisplay = () => {
    const floodSprings = useSprings(
      image.flat().length, // Total number of divs
      image.flat().map((pixel, index) => ({
        from: { height: '0%' },
        to: { height: pixel === 1 ? '100%' : '0%' },
        config: { duration: 500 },
      }))
    );

    return (
      <div>
        {image.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {row.map((pixel, colIndex) => {
              const index = rowIndex * cols + colIndex;
              return (
                <div 
                  key={index}
                  onClick={() => handleTileClick(rowIndex, colIndex)}
                  className={`w-12 h-12 border border-gray-400 m-1 transform transition-transform duration-300 hover:scale-110 rounded
                    ${ pixel >= 2 ? 'bg-gray-300' : 'bg-black'} 
                    ${(!isInitialized && selectedTile.row === rowIndex && selectedTile.col === colIndex) && 'border-4 border-white'}
                    ${(isInitialized && rowIndex === cr && colIndex === cc) && 'border-4 border-yellow-500'}`}
                >
                  <animated.div 
                    style={{ ...floodSprings[index] }}
                    className={`absolute bottom-0 left-0 w-full ${ algorithm === 'BFS' ? 'bg-blue-400' : 'bg-purple-400'}`}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>);
  }

  // Display hander for the queue/stack 
  const queueStackDisplay = () => {
    const maxDisplay = Math.floor(Math.max(5, rows / 0.6));
    const displayItems = algorithm === 'DFS' ? [...orderStructure].reverse() : orderStructure;
  
    const renderItem = (tile, index) => {
      // Calculate opacity: 100% for the first item, decreasing by 6% for each subsequent item
      const opacity = Math.max(0.1, 1 - (index * 0.06));
      return (
        <li key={index} style={{ opacity }}>
          ({tile[0]}, {tile[1]})
        </li>
      );
    };
  
    return (
      <div>
        <div className="pb-6">
          <h2 className="text-3xl font-extrabold mb-2">{algorithm === 'BFS' ? 'Shifted' : 'Popped'}:</h2>
          <p className="text-2xl text-yellow-400">
            { cr < 0 || cc < 0 ? 'None.' : `(${cr}, ${cc})` }
          </p>
        </div>
        <h2 className="text-3xl font-extrabold mb-2">
          {algorithm === 'BFS' ? 'Queue' : 'Stack'}:
        </h2>
        {orderStructure.length > 0 ? (
          <ul className='text-m'>
            {displayItems.slice(0, maxDisplay).map(renderItem)}
            {orderStructure.length > maxDisplay && (
              <li style={{ opacity: 0.1 }}>...</li>
            )}
          </ul>
        ) : (
          <p>None.</p>
        )}
      </div>
    );
  };

  // Display handler for the reset and step-through buttons
  const buttonGroupDisplay = () => {
    const isStartDisabled = isInitialized || selectedTile.row === null || selectedTile.col === null;
    const isStepDisabled = isComplete || floodFillState === null;
    const isBFS = algorithm === "BFS";
  
    const resetButtonClass = "bg-transparent text-white px-4 py-2 w-36 rounded border-2 border-gray-500 hover:border-white";
    const actionButtonClass = (disabled) => `px-4 py-2 w-36 rounded ${
      disabled
        ? 'bg-gray-500 text-white cursor-not-allowed opacity-50'
        : isBFS
          ? 'bg-transparent text-white border-2 border-blue-600 hover:border-blue-400'
          : 'bg-transparent text-white border-2 border-purple-600 hover:border-purple-400'
    }`;
  
    return (
      <div className="grid grid-cols-2 gap-4 mt-4">
        <button
          onClick={handleReset}
          className={resetButtonClass}
        >
          Reset
        </button>
        {!isInitialized ? (
          <button
            onClick={handleInitialize}
            disabled={isStartDisabled}
            className={actionButtonClass(isStartDisabled)}
          >
            Start
          </button>
        ) : (
          <button
            onClick={handleStep}
            disabled={isStepDisabled}
            className={actionButtonClass(isStepDisabled)}
          >
            {isBFS ? 'Shift' : 'Pop'}
          </button>
        )}
      </div>
    );
  };

  const algorithmExplanation = () => {
    const algorithmInfo = {
      BFS: "Breadth-First Search (BFS) is an algorithm for traversing or searching tree or graph data structures. It starts at a selected node and explores all neighboring nodes using a first-in-first-out queue structure at the present depth before moving on to nodes at the next depth level. " + 
      "In the case of this visualization, the algorithm will shift a tile from the front of the queue, check if said tile is already flooded, and if not, will add each of its non-flooded and non-blocked neighbors (up, down, left, and right) to the back of the queue. It will then shift out the next tile in the queue, repeating the process until the queue is completely empty.",
      
      DFS: "Depth-First Search (DFS) is an algorithm for traversing or searching tree or graph data structures. It starts at a selected node and explores as far as possible along each branch before backtracking. This can be done recursively or by utilizing a last-in-first-out stack structure. " +
      "In the case of this visualization, the algorithm will pop off the most recently added tile (the one at the top of the stack) and then place each of its non-flooded, non-blocked neighbors atop the stack in the following order: first up, then down, then left, then right. The algorithm will then pop off the new top of the stack and repeat the process until the stack is completely empty."
    };
  
    return (
      <div className="p-4 border-2 border-gray-300 rounded">
        <h2 className="text-2xl font-bold mb-4">{algorithm} Explanation</h2>
        <p className="mb-4">{algorithmInfo[algorithm]}</p>
        <h3 className="text-xl font-semibold mb-2">Steps:</h3>
        <ol className="list-decimal list-inside">
          {steps.map((step, index) => (
            <li key={index} className="mb-2">{step}</li>
          ))}
        </ol>
      </div>
    );
  };


  // Page output
  return (
    <div className="flex flex-col items-center pt-4 space-y-1">
      <h1 className="text-4xl font-extrabold">
        Flood Fill 
        <span className="mx-2">{ AlgorithmSelector() }</span>
        Visualizer
      </h1>

      <p className="text-2xl font-bold text-yellow-500">
            {!isInitialized ? 'Select A Tile To Begin.' : (
              isInitialized && !isComplete ? 'In Progress.' :
              'Complete.'
            )}
      </p>

      <div className="w-full grid grid-cols-3 gap-4 pb-20">
        {/* Grid configuration controls */}
        <div className="flex flex-col mr-8 inline-block items-left">
          { gridControlsDisplay() }
        </div>

        {/* Grid visualization */}
        <div className="flex flex-col items-center mt-4">
          { InteractiveGridDisplay() }
          { buttonGroupDisplay() }
        </div>

        <div className="flex flex-col items-left ml-32">
          { queueStackDisplay() }
        </div>
      </div>

      <div className="mx-20">
        { algorithmExplanation() }
      </div>
    </div>
  );
}

// Function to generate a random grid with a given number of blocked tiles
function generateRandomGrid(rows, cols, numBlkdTiles) {
  const maxBlkdTiles = rows * cols - 1;
  const effectiveBlkdTiles = Math.min(numBlkdTiles, maxBlkdTiles);
  const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
  let placedTiles = 0;

  while (placedTiles < effectiveBlkdTiles) {
      const x = Math.floor(Math.random() * rows);
      const y = Math.floor(Math.random() * cols);

      // Place a land tile if the spot is empty
      if (grid[x][y] === 0) {
          grid[x][y] = 2;
          placedTiles++;
      }
  }

  return grid;
}


// Reuse the flood fill step-by-step functions
function initializeFloodFill(image, sr, sc, floodStates) {
  const [floodStart, floodEnd] = floodStates;
  
  if (floodStart === floodEnd) {
    return null;
  }

  const m = image.length;
  const n = image[0].length;

  const queue = [[sr, sc]];
  const stack = [[sr, sc]];

  return {
    image,
    queue,
    stack,
    directions: [
      [-1, 0], // Up
      [1, 0],  // Down
      [0, -1], // Left
      [0, 1],  // Right
    ],
    floodStates,
    m,
    n,
  };
}

function floodFillStepBFS(state) {
  const { image, queue, directions, floodStates, m, n } = state;
  const [floodStart, floodEnd] = floodStates;

  if (queue.length === 0) {
    return null;
  }

  const [x, y] = queue.shift(); // BFS uses shift to get the first element (FIFO)

  if (image[x][y] === floodStart) {
    image[x][y] = floodEnd;

    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;

      if (nx >= 0 && nx < m && ny >= 0 && ny < n && image[nx][ny] === floodStart) {
        queue.push([nx, ny]);
      }
    }
  }

  return { ...state, image, queue };
}

function floodFillStepDFS(state) {
  const { image, stack, directions, floodStates, m, n } = state;
  const [floodStart, floodEnd] = floodStates;

  if (stack.length === 0) {
    return null;
  }

  const [x, y] = stack.pop(); // DFS uses pop to get the last element (LIFO)

  if (image[x][y] === floodStart) {
    image[x][y] = floodEnd;

    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;

      if (nx >= 0 && nx < m && ny >= 0 && ny < n && image[nx][ny] === floodStart) {
        stack.push([nx, ny]); // Add neighbors to the stack
      }
    }
  }

  return { ...state, image, stack };
}
