// Adicionamos um listener para garantir que o DOM esteja carregado
// antes de tentar acessar qualquer elemento.
document.addEventListener('DOMContentLoaded', () => {

    // --- Configuração Inicial ---
    
    // Elementos do DOM
    const slider = document.getElementById('angleSlider');
    const angleDegEl = document.getElementById('angleDeg');
    const angleRadEl = document.getElementById('angleRad');
    const sinValueEl = document.getElementById('sinValue');
    const cosValueEl = document.getElementById('cosValue');
    
    const btnSin = document.getElementById('btnSin');
    const btnCos = document.getElementById('btnCos');
    const btnTan = document.getElementById('btnTan');
    const btnSin2x = document.getElementById('btnSin2x');
    const btnCustom = document.getElementById('btnCustom');
    
    // NOVOS Elementos do DOM
    const btnSketch = document.getElementById('btnSketch');
    const tableContainer = document.getElementById('tableContainer');
    const tableBody = document.getElementById('tableBody');

    // Canvas do Círculo
    const canvasCircle = document.getElementById('trigCircle');
    const ctxCircle = canvasCircle.getContext('2d');
    // REVISADO: Apenas declarar, não inicializar com clientWidth
    let cWidth, cHeight, cRadius, cCenterX, cCenterY; 

    // Canvas do Gráfico
    const canvasGraph = document.getElementById('functionGraph');
    const ctxGraph = canvasGraph.getContext('2d');
    let gWidth = canvasGraph.width = canvasGraph.clientWidth;
    let gHeight = canvasGraph.height = canvasGraph.clientHeight;
    
    // Estado
    let currentAngle = 0;
    let currentFunction = 'sin'; // 'sin', 'cos', 'tan', 'sin2x', 'custom'
    let sketchIntervalId = null; // NOVO: ID do intervalo para animação

    // Cores
    const COLOR_SIN = '#ef4444'; // Vermelho
    const COLOR_COS = '#2563eb'; // Azul
    const COLOR_TAN = '#10b981'; // Verde
    const COLOR_SIN2X = '#f59e0b'; // Laranja
    const COLOR_CUSTOM = '#8b5cf6'; // Roxo
    const COLOR_GRID = '#e5e7eb'; // Cinza claro
    const COLOR_TEXT = '#374151'; // Cinza escuro
    const COLOR_AXIS = '#6b7280'; // Cinza médio

    // --- Funções de Desenho (Círculo) ---

    // NOVA FUNÇÃO para definir/atualizar dimensões
    function updateCircleDimensions() {
        // Pega o tamanho atual do elemento
        const newWidth = canvasCircle.clientWidth;
        const newHeight = canvasCircle.clientHeight;

        // Atualiza o tamanho do canvas se for diferente
        if (canvasCircle.width !== newWidth || canvasCircle.height !== newHeight) {
            cWidth = canvasCircle.width = newWidth;
            cHeight = canvasCircle.height = newHeight;
        }
        
        // Sempre recalcula a geometria
        cRadius = Math.min(cWidth, cHeight) * 0.4;
        cCenterX = cWidth / 2;
        cCenterY = cHeight / 2;
    }

    function drawCircle() {
        // ATUALIZADO: Chama a função de dimensões primeiro
        updateCircleDimensions();
        
        // O check if (canvasCircle.width !== ...) foi movido para updateCircleDimensions
        
        ctxCircle.clearRect(0, 0, cWidth, cHeight);
        ctxCircle.beginPath();
        ctxCircle.moveTo(0, cCenterY);
        ctxCircle.lineTo(cWidth, cCenterY);
        ctxCircle.moveTo(cCenterX, 0);
        ctxCircle.lineTo(cCenterX, cHeight);
        ctxCircle.strokeStyle = COLOR_GRID;
        ctxCircle.stroke();
        ctxCircle.beginPath();
        ctxCircle.arc(cCenterX, cCenterY, cRadius, 0, 2 * Math.PI);
        ctxCircle.strokeStyle = COLOR_AXIS;
        ctxCircle.lineWidth = 2;
        ctxCircle.stroke();
        drawCircleText(0, cCenterX + cRadius + 10, cCenterY);
        drawCircleText('π/2', cCenterX, cCenterY - cRadius - 10);
        drawCircleText('π', cCenterX - cRadius - 15, cCenterY);
        drawCircleText('3π/2', cCenterX, cCenterY + cRadius + 20);
        drawCircleText('2π', cCenterX + cRadius + 10, cCenterY + 15);
    }

    function drawCircleText(text, x, y) {
        ctxCircle.fillStyle = COLOR_TEXT;
        ctxCircle.font = '14px Inter';
        ctxCircle.textAlign = 'center';
        ctxCircle.textBaseline = 'middle';
        ctxCircle.fillText(text, x, y);
    }

    function updateCircle(angle) {
        drawCircle(); // Isso agora atualiza as dimensões e desenha
        
        // Adiciona uma verificação para o caso de as dimensões ainda serem 0
        if (!cRadius) return; 

        const x = cCenterX + cRadius * Math.cos(angle);
        const y = cCenterY - cRadius * Math.sin(angle);
        ctxCircle.beginPath();
        ctxCircle.moveTo(cCenterX, cCenterY);
        ctxCircle.lineTo(x, cCenterY);
        ctxCircle.strokeStyle = COLOR_COS;
        ctxCircle.lineWidth = 3;
        ctxCircle.stroke();
        ctxCircle.beginPath();
        ctxCircle.moveTo(x, cCenterY);
        ctxCircle.lineTo(x, y);
        ctxCircle.strokeStyle = COLOR_SIN;
        ctxCircle.lineWidth = 3;
        ctxCircle.stroke();
        ctxCircle.beginPath();
        ctxCircle.moveTo(cCenterX, cCenterY);
        ctxCircle.lineTo(x, y);
        ctxCircle.strokeStyle = COLOR_TEXT;
        ctxCircle.lineWidth = 1.5;
        ctxCircle.stroke();
        ctxCircle.beginPath();
        ctxCircle.arc(x, y, 6, 0, 2 * Math.PI);
        ctxCircle.fillStyle = COLOR_TEXT;
        ctxCircle.fill();
    }

    // --- Funções de Desenho (Gráfico) ---

    function getGraphYConfig() {
        // Retorna os limites e marcações do eixo Y com base na função
        switch (currentFunction) {
            case 'custom':
                return { yMin: 3.0, yMax: 7.0, yLabels: [3, 4, 5, 6, 7] }; // Foco na imagem [4, 6]
            case 'tan':
                return { yMin: -2.2, yMax: 2.2, yLabels: [-2, -1, 1, 2] };
            case 'sin':
            case 'cos':
            case 'sin2x':
            default:
                return { yMin: -1.2, yMax: 1.2, yLabels: [-1, 1] };
        }
    }

    // ESTA FUNÇÃO FOI MODIFICADA
    // Agora SÓ desenha os eixos e grades. Não desenha mais a curva.
    function drawGraphAxes() {
        if (canvasGraph.width !== canvasGraph.clientWidth || canvasGraph.height !== canvasGraph.clientHeight) {
            gWidth = canvasGraph.width = canvasGraph.clientWidth;
            gHeight = canvasGraph.height = canvasGraph.clientHeight;
        }
        ctxGraph.clearRect(0, 0, gWidth, gHeight);

        // Configuração dos Eixos
        const originX = 30;
        const graphWidth = gWidth - originX - 20;
        const graphTop = 20;
        const graphBottom = gHeight - 20;
        const graphHeight = graphBottom - graphTop;

        const { yMin, yMax, yLabels } = getGraphYConfig();
        const yRangeTotal = yMax - yMin;

        const getYPixel = (yVal) => {
            return graphTop + (yMax - yVal) / yRangeTotal * graphHeight;
        }
        const yZeroPixel = getYPixel(0);

        // Eixo X (Ângulo)
        ctxGraph.beginPath();
        ctxGraph.moveTo(originX, yZeroPixel);
        ctxGraph.lineTo(originX + graphWidth, yZeroPixel);
        ctxGraph.strokeStyle = COLOR_AXIS;
        ctxGraph.lineWidth = 2;
        ctxGraph.stroke();

        // Eixo Y (Valor)
        ctxGraph.beginPath();
        ctxGraph.moveTo(originX, graphTop);
        ctxGraph.lineTo(originX, graphBottom);
        ctxGraph.strokeStyle = COLOR_AXIS;
        ctxGraph.lineWidth = 2;
        ctxGraph.stroke();

        // Marcações do Eixo X
        ctxGraph.fillStyle = COLOR_TEXT;
        ctxGraph.font = '12px Inter';
        ctxGraph.textAlign = 'center';
        for (let i = 0; i <= 4; i++) {
            const angle = (i * Math.PI) / 2;
            const x = originX + (angle / (2 * Math.PI)) * graphWidth;
            ctxGraph.fillText(['0', 'π/2', 'π', '3π/2', '2π'][i], x, yZeroPixel + 20);
            ctxGraph.beginPath();
            ctxGraph.moveTo(x, graphTop);
            ctxGraph.lineTo(x, graphBottom);
            ctxGraph.strokeStyle = COLOR_GRID;
            ctxGraph.lineWidth = 1;
            ctxGraph.stroke();
        }

        // Marcações do Eixo Y
        ctxGraph.textAlign = 'right';
        ctxGraph.textBaseline = 'middle';
        yLabels.forEach(yVal => {
            const y = getYPixel(yVal);
            ctxGraph.fillText(yVal, originX - 8, y);
            ctxGraph.beginPath();
            ctxGraph.moveTo(originX, y);
            ctxGraph.lineTo(originX + graphWidth, y);
            ctxGraph.strokeStyle = COLOR_GRID;
            ctxGraph.lineWidth = 1;
            ctxGraph.stroke();
        });
    }
    
    // ESTA FUNÇÃO FOI MODIFICADA
    // Agora só desenha a curva. Não desenha mais os eixos.
    function plotFunction(func) {
        let color;
        let mathFunc;
        
        switch (func) {
            case 'sin':
                color = COLOR_SIN;
                mathFunc = Math.sin;
                break;
            case 'cos':
                color = COLOR_COS;
                mathFunc = Math.cos;
                break;
            case 'tan':
                color = COLOR_TAN;
                mathFunc = Math.tan;
                break;
            case 'sin2x':
                color = COLOR_SIN2X;
                mathFunc = (x) => Math.sin(2 * x);
                break;
            case 'custom':
                color = COLOR_CUSTOM;
                mathFunc = (x) => 5 + Math.sin(3 * x - 2);
                break;
            default: return;
        }

        // Pega configurações de geometria
        const originX = 30;
        const graphWidth = gWidth - originX - 20;
        const graphTop = 20;
        const graphHeight = gHeight - 40;
        const { yMin, yMax } = getGraphYConfig();
        const yRangeTotal = yMax - yMin;
        const getYPixel = (yVal) => {
            return graphTop + (yMax - yVal) / yRangeTotal * graphHeight;
        }

        ctxGraph.beginPath();
        ctxGraph.strokeStyle = color;
        ctxGraph.lineWidth = 3;

        const steps = graphWidth;
        for (let i = 0; i <= steps; i++) {
            const xPixel = originX + i;
            const angle = (i / graphWidth) * (2 * Math.PI);
            let yVal = mathFunc(angle);

            if (func === 'tan') {
                if (yVal > yMax * 1.5) yVal = yMax * 1.5;
                if (yVal < yMin * 1.5) yVal = yMin * 1.5;
            }
            
            const yPixel = getYPixel(yVal);

            if (i === 0) {
                ctxGraph.moveTo(xPixel, yPixel);
            } else {
                const prevAngle = ((i - 1) / graphWidth) * (2 * Math.PI);
                const prevYVal = mathFunc(prevAngle);
                if (func === 'tan' && Math.abs(prevYVal - yVal) > yRangeTotal * 2) {
                    ctxGraph.stroke();
                    ctxGraph.beginPath();
                    ctxGraph.moveTo(xPixel, yPixel);
                } else {
                    ctxGraph.lineTo(xPixel, yPixel);
                }
            }
        }
        ctxGraph.stroke();
    }

    // ESTA FUNÇÃO FOI MODIFICADA
    function updateGraphPoint(angle) {
        // Para a animação de esboço se estiver rodando
        if (sketchIntervalId) {
            clearInterval(sketchIntervalId);
            sketchIntervalId = null;
        }
        tableContainer.classList.add('hidden'); // Esconde tabela

        // Desenha eixos e a curva completa
        drawGraphAxes(); 
        plotFunction(currentFunction);

        // Pega config
        const originX = 30;
        const graphWidth = gWidth - originX - 20;
        const graphTop = 20;
        const graphHeight = gHeight - 40;
        const { yMin, yMax } = getGraphYConfig();
        const yRangeTotal = yMax - yMin;
        const getYPixel = (yVal) => {
            return graphTop + (yMax - yVal) / yRangeTotal * graphHeight;
        }
        
        let yVal;
        let color;

        switch (currentFunction) {
            case 'sin':
                yVal = Math.sin(angle);
                color = COLOR_SIN;
                break;
            case 'cos':
                yVal = Math.cos(angle);
                color = COLOR_COS;
                break;
            case 'tan':
                yVal = Math.tan(angle);
                color = COLOR_TAN;
                if (yVal > yMax * 1.5) yVal = yMax * 1.5;
                if (yVal < yMin * 1.5) yVal = yMin * 1.5;
                break;
            case 'sin2x':
                yVal = Math.sin(2 * angle);
                color = COLOR_SIN2X;
                break;
            case 'custom':
                yVal = 5 + Math.sin(3 * angle - 2);
                color = COLOR_CUSTOM;
                break;
        }

        const x = originX + (angle / (2 * Math.PI)) * graphWidth;
        const y = getYPixel(yVal);

        // Desenha o ponto no gráfico
        ctxGraph.beginPath();
        ctxGraph.arc(x, y, 6, 0, 2 * Math.PI);
        ctxGraph.fillStyle = color;
        ctxGraph.fill();
        ctxGraph.strokeStyle = 'white';
        ctxGraph.lineWidth = 2;
        ctxGraph.stroke();
    }

    // --- NOVA FUNÇÃO PARA ESBOÇAR GRÁFICO E TABELA ---
    function sketchGraphAndTable() {
        // Para qualquer animação anterior
        if (sketchIntervalId) {
            clearInterval(sketchIntervalId);
        }

        // Limpa e mostra a tabela
        tableContainer.classList.remove('hidden');
        tableBody.innerHTML = '';

        // Desenha apenas os eixos
        drawGraphAxes();

        // Pega a função e cor
        let color;
        let mathFunc;
        switch (currentFunction) {
            case 'sin': color = COLOR_SIN; mathFunc = Math.sin; break;
            case 'cos': color = COLOR_COS; mathFunc = Math.cos; break;
            case 'tan': color = COLOR_TAN; mathFunc = Math.tan; break;
            case 'sin2x': color = COLOR_SIN2X; mathFunc = (x) => Math.sin(2 * x); break;
            case 'custom': color = COLOR_CUSTOM; mathFunc = (x) => 5 + Math.sin(3 * x - 2); break;
            default: return;
        }

        // Pega config de geometria
        const originX = 30;
        const graphWidth = gWidth - originX - 20;
        const graphTop = 20;
        const graphHeight = gHeight - 40;
        const { yMin, yMax } = getGraphYConfig();
        const yRangeTotal = yMax - yMin;
        const getYPixel = (yVal) => {
            return graphTop + (yMax - yVal) / yRangeTotal * graphHeight;
        }

        let i = 0;
        const steps = graphWidth;
        
        ctxGraph.strokeStyle = color;
        ctxGraph.lineWidth = 3;
        ctxGraph.beginPath();
        
        let lastAddedNotableAngle = ""; // NOVO: Rastreia o último ângulo notável adicionado

        sketchIntervalId = setInterval(() => {
            if (i > steps) {
                clearInterval(sketchIntervalId);
                sketchIntervalId = null;
                return;
            }

            const xPixel = originX + i;
            const angle = (i / graphWidth) * (2 * Math.PI);
            let yVal = mathFunc(angle);

            let isAsymptote = false;
            if (currentFunction === 'tan') {
                if (yVal > yMax * 1.5) { yVal = yMax * 1.5; isAsymptote = true; }
                if (yVal < yMin * 1.5) { yVal = yMin * 1.5; isAsymptote = true; }
            }
            
            const yPixel = getYPixel(yVal);

            // Desenha o segmento
            if (i === 0) {
                ctxGraph.moveTo(xPixel, yPixel);
            } else {
                // Verifica assíntota da tangente
                const prevAngle = ((i - 1) / graphWidth) * (2 * Math.PI);
                const prevYVal = mathFunc(prevAngle);
                if (currentFunction === 'tan' && Math.abs(prevYVal - yVal) > yRangeTotal * 2) {
                    ctxGraph.stroke();
                    ctxGraph.beginPath();
                    ctxGraph.moveTo(xPixel, yPixel);
                } else {
                    ctxGraph.lineTo(xPixel, yPixel);
                    ctxGraph.stroke(); // Desenha o segmento
                    ctxGraph.beginPath(); // Começa novo
                    ctxGraph.moveTo(xPixel, yPixel); // Move para o fim do segmento
                }
            }

            // --- LÓGICA DA TABELA MODIFICADA ---
            const angleStr = formatAngleRad(angle);

            // Adiciona linha na tabela APENAS se for um ângulo notável novo
            // (Verifica se não contém "." e se é diferente do último adicionado)
            if (!angleStr.includes('.') && angleStr !== lastAddedNotableAngle) {
                const row = tableBody.insertRow();
                const yValStr = (isAsymptote) ? "&infin;" : yVal.toFixed(2);
                row.innerHTML = `<td class="px-4 py-2 font-mono">${angleStr}</td><td class="px-4 py-2 font-mono">${yValStr}</td>`;
                tableContainer.scrollTop = tableContainer.scrollHeight; // Auto-scroll
                lastAddedNotableAngle = angleStr; // Marca como adicionado
            }
            // --- FIM DA LÓGICA MODIFICADA ---

            i++;
        }, 10); // 10ms por passo
    }


    // --- Funções Utilitárias ---
    function gcd(a, b) {
        return b === 0 ? a : gcd(b, a % b);
    }

    function formatAngleRad(angle) {
        if (angle < 0.01) return "0";
        const val = angle / Math.PI;
        const denominators = [2, 3, 4, 6, 8, 12]; 
        const tolerance = 0.02; 
        for (const den of denominators) {
            const num = val * den;
            const roundedNum = Math.round(num);
            if (Math.abs(num - roundedNum) < tolerance) {
                if (roundedNum === 0) return "0";
                const g = gcd(roundedNum, den);
                const numSimpl = roundedNum / g;
                const denSimpl = den / g;
                if (denSimpl === 1) { return (numSimpl === 1) ? "π" : `${numSimpl}π`; }
                if (numSimpl === 1) { return `π/${denSimpl}`; }
                return `${numSimpl}π/${denSimpl}`;
            }
        }
        return angle.toFixed(2);
    }

    // --- Lógica Principal de Atualização ---
    function updateAll(angle) {
        currentAngle = angle;
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        const deg = angle * (180 / Math.PI);

        angleDegEl.textContent = `${deg.toFixed(0)}°`;
        angleRadEl.textContent = formatAngleRad(angle);
        sinValueEl.textContent = sin.toFixed(2);
        cosValueEl.textContent = cos.toFixed(2);
        
        updateCircle(angle);
        updateGraphPoint(angle); // Isso agora desenha eixos, curva e ponto
    }

    // --- Event Listeners ---

    // Slider
    slider.addEventListener('input', (e) => {
        updateAll(parseFloat(e.target.value));
    });

    // Botões de Função
    [btnSin, btnCos, btnTan, btnSin2x, btnCustom].forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentFunction = e.target.id.replace('btn', '').toLowerCase();
            updateButtonStyles();
            updateAll(currentAngle); // Redesenha tudo no modo interativo
        });
    });
    
    // NOVO Listener
    btnSketch.addEventListener('click', () => {
        sketchGraphAndTable();
    });
    
    function updateButtonStyles() {
        const buttons = [btnSin, btnCos, btnTan, btnSin2x, btnCustom];
        const activeClasses = ['bg-blue-600', 'text-white', 'shadow-md'];
        const inactiveClasses = ['bg-white', 'text-blue-600', 'border', 'border-blue-600'];
        
        buttons.forEach(btn => {
            const func = btn.id.replace('btn', '').toLowerCase();
            if (func === currentFunction) {
                btn.classList.add(...activeClasses);
                btn.classList.remove(...inactiveClasses);
            } else {
                btn.classList.add(...inactiveClasses);
                btn.classList.remove(...activeClasses);
            }
        });
    }
    
    // Redimensionamento da Janela
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            cWidth = canvasCircle.width = canvasCircle.clientWidth;
            cHeight = canvasCircle.height = canvasCircle.clientHeight;
            gWidth = canvasGraph.width = canvasGraph.clientWidth;
            gHeight = canvasGraph.height = canvasGraph.clientHeight;
            updateAll(currentAngle); // Redesenha no modo interativo
        }, 250);
    });

    // --- Inicialização ---
    updateButtonStyles();
    updateAll(0);

}); // Fim do 'DOMContentLoaded'
