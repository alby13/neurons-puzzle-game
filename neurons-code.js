<script>
        document.addEventListener('DOMContentLoaded', function() {
            const LAYERS = [3, 5, 7, 7, 5, 3];
            const NEURON_DISTANCE_X = 120;
            const NEURON_DISTANCE_Y = 80;
            let currentLevel = 1;
            let levelsCompleted = 0;
            let levelOver = false;
            let moves = 0;
            let neurons = [];
            let connections = [];
            let inputNeuron, outputNeuron;
            let gameBoard, svg;

            function initGame() {
                gameBoard = document.getElementById('game-board');
                svg = document.getElementById('connections');
                
                document.getElementById('reset').addEventListener('click', resetLevel);
                document.getElementById('next-level').addEventListener('click', nextLevel);
                document.getElementById('quit-button').addEventListener('click', quitGame);

                resetLevel();
            }

            function createBoard() {
                const boardWidth = (LAYERS.length - 1) * NEURON_DISTANCE_X;
                const boardHeight = (Math.max(...LAYERS) - 1) * NEURON_DISTANCE_Y;
                gameBoard.style.width = `${boardWidth}px`;
                gameBoard.style.height = `${boardHeight}px`;
                svg.setAttribute('width', boardWidth);
                svg.setAttribute('height', boardHeight);
                
                neurons = [];
                connections = [];
                svg.innerHTML = '';
                gameBoard.innerHTML = '';
                gameBoard.appendChild(svg);

                let neuronIndex = 0;
                for (let i = 0; i < LAYERS.length; i++) {
                    const layerSize = LAYERS[i];
                    const startY = (boardHeight - (layerSize - 1) * NEURON_DISTANCE_Y) / 2;
                    for (let j = 0; j < layerSize; j++) {
                        const neuron = document.createElement('div');
                        neuron.className = 'neuron';
                        neuron.style.left = `${i * NEURON_DISTANCE_X}px`;
                        neuron.style.top = `${startY + j * NEURON_DISTANCE_Y}px`;
                        neuron.textContent = neuronIndex + 1;
                        neuron.dataset.index = neuronIndex;
                        neuron.addEventListener('click', function() {
                            toggleNeuron(parseInt(this.dataset.index));
                        });
                        gameBoard.appendChild(neuron);
                        neurons.push(neuron);
                        neuronIndex++;
                    }
                }

                inputNeuron = Math.floor(Math.random() * LAYERS[0]);
                outputNeuron = neurons.length - 1 - Math.floor(Math.random() * LAYERS[LAYERS.length - 1]);

                neurons[inputNeuron].classList.add('input');
                neurons[outputNeuron].classList.add('output');

                const obstacleCount = Math.floor(neurons.length / 5);
                for (let i = 0; i < obstacleCount; i++) {
                    let obstacleIndex;
                    do {
                        obstacleIndex = Math.floor(Math.random() * neurons.length);
                    } while (obstacleIndex === inputNeuron || obstacleIndex === outputNeuron || neurons[obstacleIndex].classList.contains('obstacle'));
                    neurons[obstacleIndex].classList.add('obstacle');
                }

                moves = 0;
                updateStats();
                updateConnections();
            }

            function toggleNeuron(index) {
                if (index !== inputNeuron && index !== outputNeuron && !neurons[index].classList.contains('obstacle')) {
                    const canActivate = getNeighbors(index).some(neighborIndex => 
                        neurons[neighborIndex].classList.contains('active') || 
                        neighborIndex === inputNeuron
                    );
                    
                    if (canActivate || neurons[index].classList.contains('active')) {
                        neurons[index].classList.toggle('active');
                        moves++;
                        updateConnections();
                        checkWinCondition();
                        updateStats();
                    }
                }
            }

            function updateConnections() {
                svg.innerHTML = '';
                connections = [];

                for (let i = 0; i < neurons.length; i++) {
                    if (neurons[i].classList.contains('active') || i === inputNeuron || i === outputNeuron) {
                        const neighbors = getNeighbors(i);
                        for (const neighbor of neighbors) {
                            if (neurons[neighbor].classList.contains('active') || neighbor === inputNeuron || neighbor === outputNeuron) {
                                drawConnection(i, neighbor);
                            }
                        }
                    }
                }
            }

            function drawConnection(from, to) {
                const fromRect = neurons[from].getBoundingClientRect();
                const toRect = neurons[to].getBoundingClientRect();
                const boardRect = gameBoard.getBoundingClientRect();

                const fromX = fromRect.left - boardRect.left + fromRect.width / 2;
                const fromY = fromRect.top - boardRect.top + fromRect.height / 2;
                const toX = toRect.left - boardRect.left + toRect.width / 2;
                const toY = toRect.top - boardRect.top + toRect.height / 2;

                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', fromX);
                line.setAttribute('y1', fromY);
                line.setAttribute('x2', toX);
                line.setAttribute('y2', toY);
                line.setAttribute('stroke', '#fff');
                line.setAttribute('stroke-width', '2');
                svg.appendChild(line);

                connections.push([from, to]);
            }

            function checkWinCondition() {
                const queue = [inputNeuron];
                const visited = new Set();

                while (queue.length > 0) {
                    const current = queue.shift();
                    if (current === outputNeuron) {
                         if (!levelOver) {
                        levelOver = true;
                        document.getElementById('status').textContent = 'Level Complete!';
                        document.getElementById('next-level').disabled = false;
                        document.getElementById('next-level').classList.add('pulse');
                        levelsCompleted++;
                                               }
                        return;
                    }

                    visited.add(current);

                    for (const [from, to] of connections) {
                        if (from === current && !visited.has(to)) {
                            queue.push(to);
                        } else if (to === current && !visited.has(from)) {
                            queue.push(from);
                        }
                    }
                }

                document.getElementById('status').textContent = 'Keep trying!';
                document.getElementById('next-level').disabled = true;
                document.getElementById('next-level').classList.remove('pulse');
            }

            function getNeighbors(index) {
                const neighbors = [];
                let currentLayerStart = 0;
                let currentLayer = 0;

                while (currentLayerStart + LAYERS[currentLayer] <= index) {
                    currentLayerStart += LAYERS[currentLayer];
                    currentLayer++;
                }

                const prevLayerStart = currentLayer > 0 ? currentLayerStart - LAYERS[currentLayer - 1] : 0;
                const nextLayerStart = currentLayerStart + LAYERS[currentLayer];

                if (currentLayer > 0) {
                    for (let i = prevLayerStart; i < currentLayerStart; i++) {
                        neighbors.push(i);
                    }
                }

                if (currentLayer < LAYERS.length - 1) {
                    for (let i = nextLayerStart; i < nextLayerStart + LAYERS[currentLayer + 1]; i++) {
                        neighbors.push(i);
                    }
                }

                return neighbors;
            }

            function resetLevel() {
                levelOver = false;
                createBoard();
                document.getElementById('status').textContent = 'Your Prompt: Connect the input (blue) to the output (yellow)';
                document.getElementById('next-level').disabled = true;
                document.getElementById('next-level').classList.remove('pulse');
            }

            function nextLevel() {
                levelsCompleted++;
                currentLevel++;
                resetLevel();
            }

            function updateStats() {
                document.getElementById('current-level').textContent = currentLevel;
                document.getElementById('levels-completed').textContent = levelsCompleted;
                document.getElementById('moves').textContent = moves;
            }

            function quitGame() {
                if (confirm('Are you sure you want to quit the game?')) {
                    window.close();
                }
            }

            initGame();
        });
</script>