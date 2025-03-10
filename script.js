document.addEventListener('DOMContentLoaded', function() {
    // Canvas setup
    const canvas = document.getElementById('drawingCanvas');
    const ctx = canvas.getContext('2d');
    
    // Tool buttons
    const brushTool = document.getElementById('brushTool');
    const eraserTool = document.getElementById('eraserTool');
    const textTool = document.getElementById('textTool');
    const lineTool = document.getElementById('lineTool');
    const rectangleTool = document.getElementById('rectangleTool');
    const circleTool = document.getElementById('circleTool');
    
    // Controls
    const brushColor = document.getElementById('brushColor');
    const brushSize = document.getElementById('brushSize');
    const sizeValue = document.getElementById('sizeValue');
    const rainbowMode = document.getElementById('rainbowMode');
    const textInput = document.getElementById('textInput');
    const addTextBtn = document.getElementById('addTextBtn');
    const undoBtn = document.getElementById('undoBtn');
    const clearBtn = document.getElementById('clearBtn');
    const saveBtn = document.getElementById('saveBtn');
    
    // Drawing state variables
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let currentTool = 'brush';
    let addingText = false;
    let startX, startY; // For shapes
    let history = []; // For undo functionality
    let rainbowHue = 0; // For rainbow mode
    
    // Resize canvas to fit container
    function resizeCanvas() {
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = window.innerHeight * 0.6; // 60% of viewport height
        
        // Save current canvas state to history after resize
        saveToHistory();
    }
    
    // Initialize canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Save current state to history
    function saveToHistory() {
        // Limit history size to prevent memory issues
        if (history.length >= 20) {
            history.shift(); // Remove oldest state
        }
        
        history.push(canvas.toDataURL());
    }
    
    // Undo last action
    function undo() {
        if (history.length > 0) {
            const previousState = history.pop();
            const img = new Image();
            img.src = previousState;
            img.onload = function() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
        }
    }
    
    // Update brush size display
    brushSize.addEventListener('input', function() {
        sizeValue.textContent = `${this.value}px`;
    });
    
    // Set active tool
    function setActiveTool(tool) {
        // Remove active class from all tools
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Set current tool
        currentTool = tool;
        
        // Add active class to selected tool
        switch(tool) {
            case 'brush':
                brushTool.classList.add('active');
                canvas.style.cursor = 'crosshair';
                break;
            case 'eraser':
                eraserTool.classList.add('active');
                canvas.style.cursor = 'crosshair';
                break;
            case 'text':
                textTool.classList.add('active');
                canvas.style.cursor = 'text';
                break;
            case 'line':
                lineTool.classList.add('active');
                canvas.style.cursor = 'crosshair';
                break;
            case 'rectangle':
                rectangleTool.classList.add('active');
                canvas.style.cursor = 'crosshair';
                break;
            case 'circle':
                circleTool.classList.add('active');
                canvas.style.cursor = 'crosshair';
                break;
        }
    }
    
    // Get rainbow color
    function getRainbowColor() {
        rainbowHue = (rainbowHue + 1) % 360;
        return `hsl(${rainbowHue}, 100%, 50%)`;
    }
    
    // Drawing functionality
    function startDrawing(e) {
        if (addingText) return;
        
        isDrawing = true;
        [lastX, lastY] = getMousePos(canvas, e);
        
        // For shapes, store starting position
        startX = lastX;
        startY = lastY;
        
        // For free drawing, draw a dot at the starting point
        if (currentTool === 'brush' || currentTool === 'eraser') {
            ctx.beginPath();
            ctx.arc(lastX, lastY, brushSize.value / 2, 0, Math.PI * 2);
            
            if (currentTool === 'eraser') {
                ctx.fillStyle = 'white';
            } else if (rainbowMode.checked) {
                ctx.fillStyle = getRainbowColor();
            } else {
                ctx.fillStyle = brushColor.value;
            }
            
            ctx.fill();
        }
    }
    
    function draw(e) {
        if (!isDrawing) return;
        
        const [x, y] = getMousePos(canvas, e);
        
        // For shapes, we'll preview them during drag
        if (currentTool === 'line' || currentTool === 'rectangle' || currentTool === 'circle') {
            // Clear canvas to previous state for live preview
            const img = new Image();
            img.src = history[history.length - 1];
            img.onload = function() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                
                // Draw shape preview
                ctx.beginPath();
                ctx.lineWidth = brushSize.value;
                ctx.strokeStyle = rainbowMode.checked ? getRainbowColor() : brushColor.value;
                
                if (currentTool === 'line') {
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(x, y);
                } else if (currentTool === 'rectangle') {
                    ctx.rect(startX, startY, x - startX, y - startY);
                } else if (currentTool === 'circle') {
                    const radius = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
                    ctx.arc(startX, startY, radius, 0, Math.PI * 2);
                }
                
                ctx.stroke();
            };
            return;
        }
        
        // For brush and eraser, draw continuously
        if (currentTool === 'brush' || currentTool === 'eraser') {
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
            ctx.lineWidth = brushSize.value;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            if (currentTool === 'eraser') {
                ctx.strokeStyle = 'white';
            } else if (rainbowMode.checked) {
                ctx.strokeStyle = getRainbowColor();
            } else {
                ctx.strokeStyle = brushColor.value;
            }
            
            ctx.stroke();
            
            [lastX, lastY] = [x, y];
        }
    }
    
    function stopDrawing(e) {
        if (!isDrawing) return;
        
        // For shapes, finalize the shape when mouse is released
        if (currentTool === 'line' || currentTool === 'rectangle' || currentTool === 'circle') {
            const [x, y] = getMousePos(canvas, e);
            
            ctx.beginPath();
            ctx.lineWidth = brushSize.value;
            ctx.strokeStyle = rainbowMode.checked ? getRainbowColor() : brushColor.value;
            
            if (currentTool === 'line') {
                ctx.moveTo(startX, startY);
                ctx.lineTo(x, y);
            } else if (currentTool === 'rectangle') {
                ctx.rect(startX, startY, x - startX, y - startY);
            } else if (currentTool === 'circle') {
                const radius = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
                ctx.arc(startX, startY, radius, 0, Math.PI * 2);
            }
            
            ctx.stroke();
            
            // Save state after drawing a shape
            saveToHistory();
        } else if (currentTool === 'brush' || currentTool === 'eraser') {
            // Save state after free drawing
            saveToHistory();
        }
        
        isDrawing = false;
    }
    
    // Get mouse position relative to canvas
    function getMousePos(canvas, e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        // Handle both mouse and touch events
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        return [
            (clientX - rect.left) * scaleX,
            (clientY - rect.top) * scaleY
        ];
    }
    
    // Text functionality
    function activateTextTool() {
        setActiveTool('text');
        
        const text = textInput.value.trim();
        if (text) {
            addingText = true;
            
            // Show instruction tooltip
            const tooltip = document.createElement('div');
            tooltip.textContent = 'Click on canvas to place text';
            tooltip.className = 'tooltip';
            document.body.appendChild(tooltip);
            
            // Remove tooltip when text is placed or canceled
            function removeTooltip() {
                if (document.body.contains(tooltip)) {
                    document.body.removeChild(tooltip);
                }
            }
            
            function placeText(e) {
                if (!addingText) return;
                
                const [x, y] = getMousePos(canvas, e);
                
                // Save state before adding text
                saveToHistory();
                
                ctx.font = `${brushSize.value * 2}px Arial`;
                ctx.fillStyle = rainbowMode.checked ? getRainbowColor() : brushColor.value;
                ctx.fillText(text, x, y);
                
                textInput.value = '';
                addingText = false;
                setActiveTool('brush');
                
                // Save state after adding text
                saveToHistory();
                
                // Remove event listener and tooltip
                canvas.removeEventListener('click', placeText);
                removeTooltip();
            }
            
            // Cancel text placement on escape key
            function cancelTextPlacement(e) {
                if (e.key === 'Escape' && addingText) {
                    addingText = false;
                    setActiveTool('brush');
                    canvas.removeEventListener('click', placeText);
                    removeTooltip();
                    document.removeEventListener('keydown', cancelTextPlacement);
                }
            }
            
            canvas.addEventListener('click', placeText);
            document.addEventListener('keydown', cancelTextPlacement);
        }
    }
    
    // Tool button event listeners
    brushTool.addEventListener('click', () => setActiveTool('brush'));
    eraserTool.addEventListener('click', () => setActiveTool('eraser'));
    textTool.addEventListener('click', () => setActiveTool('text'));
    lineTool.addEventListener('click', () => setActiveTool('line'));
    rectangleTool.addEventListener('click', () => setActiveTool('rectangle'));
    circleTool.addEventListener('click', () => setActiveTool('circle'));
    
    // Add text button
    addTextBtn.addEventListener('click', activateTextTool);
    
    // Undo button
    undoBtn.addEventListener('click', undo);
    
    // Clear canvas
    clearBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear the canvas?')) {
            // Save current state before clearing
            saveToHistory();
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    });
    
    // Save drawing as PNG
    saveBtn.addEventListener('click', function() {
        const link = document.createElement('a');
        link.download = 'drawing.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
    
    // Event listeners for mouse
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Event listeners for touch devices
    canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();
        startDrawing(e);
    });
    
    canvas.addEventListener('touchmove', function(e) {
        e.preventDefault();
        draw(e);
    });
    
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('touchcancel', stopDrawing);
    
    // Initialize history with blank canvas
    saveToHistory();
});
