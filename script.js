import { Grid } from "./grid.js";
import { Tile } from "./tile.js";

const gameBoard = document.getElementById("game-board");

const grid = new Grid(gameBoard);
grid.getRandomEmptyCell().linkTile(new Tile(gameBoard));
grid.getRandomEmptyCell().linkTile(new Tile(gameBoard));
setupInputOnce();

function setupInputOnce() {
    window.addEventListener("keydown", handleInput, { once: true });
}

async function handleInput(event) {
    switch (event.key) {
        case "ArrowUp":
            if (!canMoveUp()) {
                setupInputOnce();
                return;
            }
            await moveUp();
            break;
        case "ArrowDown":
            if (!canMoveDown()) {
                setupInputOnce();
                return;
            }
            await moveDown();
            break;
        case "ArrowLeft":
            if (!canMoveLeft()) {
                setupInputOnce();
                return;
            }
            await moveLeft();
            break;
        case "ArrowRight":
            if (!canMoveRight()) {
                setupInputOnce();
                return;
            }
            await moveRight();
            break;
        default:
            setupInputOnce();
            return;
    }

    const newTile = new Tile(gameBoard);
    grid.getRandomEmptyCell().linkTile(newTile);

    if (!canMoveUp() && !canMoveDown() && !canMoveLeft() && !canMoveRight()) {
        await newTile.waitForAnimationEnd();
        alert("Try again!");
        return;
    }

    setupInputOnce();
}




let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', function(event) {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
});

document.addEventListener('touchmove', function(event) {
    event.preventDefault(); // Предотвращаем стандартное поведение прокрутки при свайпе
}, { passive: false });

document.addEventListener('touchend', async function(event) {
    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
            if (!canMoveRight()) {
                setupInputOnce();
                return;
            }
            moveRight();
        } else {
            if (!canMoveLeft()) {
                setupInputOnce();
                return;
            }
            moveLeft();
        }
    } else {
        if (deltaY > 0) {
            if (!canMoveDown()) {
                setupInputOnce();
                return;
            }
            moveDown();
        } else {
            if (!canMoveUp()) {
                setupInputOnce();
                return;
            }
            moveUp();
        }
    }

    const newTile = new Tile(gameBoard);
    grid.getRandomEmptyCell().linkTile(newTile);

    if (!canMoveUp() && !canMoveDown() && !canMoveLeft() && !canMoveRight()) {
        await newTile.waitForAnimationEnd();
        alert("Try again!");
        return;
    }

    setupInputOnce();
});


async function moveUp() {
    await slideTiles(grid.cellsGroupedByColumn);
}

async function moveDown() {
    await slideTiles(grid.cellsGroupedByReversedColumn);
}

async function moveLeft() {
    await slideTiles(grid.cellsGroupedByRow);
}

async function moveRight() {
    await slideTiles(grid.cellsGroupedByReversedRow);
}




async function slideTiles(groupedCells) {
    const promieses = [];
    groupedCells.forEach(group => slideTilesInGroup(group, promieses));

    await Promise.all(promieses);

    grid.cells.forEach(cell => {
        cell.hasTileForMerge() && cell.mergeTiles();
    });
}

function slideTilesInGroup(group, promieses) {
    for (let i = 1; i < group.length; i++) {
        if (group[i].isEmpty()) {
            continue;
        }
        const cellWithTile = group[i];
        let targetCell;
        let j = i - 1;
        while (j >= 0 && group[j].canAccept(cellWithTile.linkedTile)) {
            targetCell = group[j];
            j--;
        }
        

        if (!targetCell) {
            continue;    
        }

        promieses.push(cellWithTile.linkedTile.waitForTransitionEnd());

        if (targetCell.isEmpty()) {
            targetCell.linkTile(cellWithTile.linkedTile);
        } else {
            targetCell.linkTileForMerge(cellWithTile.linkedTile);
        }

        cellWithTile.unlinkTile();

    }
}

function canMoveUp() {
    return canMove(grid.cellsGroupedByColumn);
}
function canMoveDown() {
    return canMove(grid.cellsGroupedByReversedColumn);
}
function canMoveLeft() {
    return canMove(grid.cellsGroupedByRow);
}
function canMoveRight() {
    return canMove(grid.cellsGroupedByReversedRow);
}



function canMove(groupedCells) {
    return groupedCells.some(group => canMoveInGroup(group));
}

function canMoveInGroup(group) {
    return group.some((cell, index) => {
        if (index === 0) {
            return false;
        }

        if (cell.isEmpty()) {
            return false;
        }

        const targetCell = group[index - 1];
        return targetCell.canAccept(cell.linkedTile);
    });
}