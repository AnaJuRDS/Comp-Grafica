// Seleciona o elemento canvas e obtém o contexto WebGL
const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    throw new Error('WebGL não suportado'); // Verifica se o navegador suporta WebGL
}

// Define as cores associadas às teclas de 0 a 9
const colors = [
    [1.0, 0.0, 0.0], // Vermelho
    [0.0, 1.0, 0.0], // Verde
    [0.0, 0.0, 1.0], // Azul
    [1.0, 1.0, 0.0], // Amarelo
    [1.0, 0.0, 1.0], // Magenta
    [0.0, 1.0, 1.0], // Ciano
    [0.5, 0.5, 0.5], // Cinza
    [1.0, 0.5, 0.5], // Rosa
    [0.5, 1.0, 0.5], // Verde claro
    [0.5, 0.5, 1.0]  // Azul claro
];

let points = [];               // Array para armazenar os pontos do triângulo
let currentColor = colors[2];   // Cor inicial (azul)
let drawMode = 'line';          // Modo inicial de desenho ('line' ou 'triangle')
let lineWidth = 1.0;            // Largura inicial do traçado
let mode = 'color';             // Modo inicial ('color' para cor e 'width' para espessura)

// Vertex Shader: define a posição do ponto e o tamanho
const vertexShaderSource = `
    attribute vec2 position;
    uniform float pointSize;
    void main() {
        gl_Position = vec4(position, 0.0, 1.0);
        gl_PointSize = pointSize;
    }
`;

// Fragment Shader: define a cor do ponto
const fragmentShaderSource = `
    precision mediump float;
    uniform vec3 color;
    void main() {
        gl_FragColor = vec4(color, 1.0);
    }
`;

// Função para criar um shader (vertex ou fragment)
function createShader(gl, type, source) {
    const shader = gl.createShader(type);      // Cria o shader
    gl.shaderSource(shader, source);           // Associa o código-fonte do shader
    gl.compileShader(shader);                  // Compila o shader
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader)); // Log de erro caso a compilação falhe
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

// Compila os shaders e cria o programa WebGL
const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program)); // Log de erro caso o link falhe
    gl.deleteProgram(program);
}

// Ativa o programa WebGL
gl.useProgram(program);

// Localiza o atributo de posição e os uniforms de cor e ponto no shader
const positionAttributeLocation = gl.getAttribLocation(program, 'position');
const colorUniformLocation = gl.getUniformLocation(program, 'color');
const pointSizeUniformLocation = gl.getUniformLocation(program, 'pointSize');

// Cria um buffer de posição e associa ao contexto WebGL
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

// Ativa e define o atributo de posição para usar o buffer
gl.enableVertexAttribArray(positionAttributeLocation);
gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

// Converte coordenadas de pixel para o espaço de coordenadas do WebGL
function pixelToClipSpace(x, y) {
    return [
        (x / canvas.width) * 2 - 1, // Converte x de pixel para clip space
        (y / canvas.height) * 2 - 1 // Converte y de pixel para clip space
    ];
}

// Função para desenhar uma linha entre dois pontos usando o algoritmo de Bresenham
function drawLine(p1, p2, color) {
    let x1 = p1.x;
    let y1 = p1.y;
    let x2 = p2.x;
    let y2 = p2.y;

    let dx = Math.abs(x2 - x1); // Calcula a diferença absoluta no eixo x
    let dy = Math.abs(y2 - y1); // Calcula a diferença absoluta no eixo y

    let sx = x1 < x2 ? 1 : -1; // Direção de movimento no eixo x
    let sy = y1 < y2 ? 1 : -1; // Direção de movimento no eixo y
    let err = dx - dy;         // Inicializa o erro

    gl.uniform3fv(colorUniformLocation, color); // Define a cor atual no shader
    gl.uniform1f(pointSizeUniformLocation, lineWidth); // Define a largura do traçado

    // Desenha o ponto inicial e percorre cada ponto até o final
    while (true) {
        const clipSpacePoint = pixelToClipSpace(x1, y1); // Converte para o espaço de clip
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(clipSpacePoint), gl.STATIC_DRAW);
        gl.drawArrays(gl.POINTS, 0, 1); // Desenha o ponto atual

        if (x1 === x2 && y1 === y2) break; // Termina se o ponto final for alcançado

        const e2 = 2 * err;
        if (e2 > -dy) { // Move-se na direção x
            err -= dy;
            x1 += sx;
        }
        if (e2 < dx) { // Move-se na direção y
            err += dx;
            y1 += sy;
        }
    }
}

// Função para desenhar um triângulo a partir de três pontos
function drawTriangle(p1, p2, p3, color) {
    drawLine(p1, p2, color); // Desenha o primeiro lado
    drawLine(p2, p3, color); // Desenha o segundo lado
    drawLine(p3, p1, color); // Desenha o terceiro lado
}

// Detecta o clique do mouse e define os pontos de início e fim da linha ou triângulo
canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;     // Converte a posição x do clique
    const y = canvas.height - (event.clientY - rect.top); // Converte a posição y do clique

    if (drawMode === 'line') {          // Se o modo de desenho for linha
        if (points.length === 0) {      // Primeiro ponto da linha
            points.push({ x, y });
        } else {                        // Segundo ponto da linha
            drawLine(points[0], { x, y }, currentColor); // Desenha a linha
            points = [];                // Limpa os pontos
        }
    } else if (drawMode === 'triangle') { // Se o modo de desenho for triângulo
        points.push({ x, y });
        if (points.length === 3) {      // Quando três pontos são selecionados
            drawTriangle(points[0], points[1], points[2], currentColor); // Desenha o triângulo
            points = [];                // Limpa os pontos
        }
    }
});

// Muda a cor ou espessura com base na tecla numérica, dependendo do modo ativo
document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();

    if (mode === 'color' && key >= '0' && key <= '9') {
        currentColor = colors[parseInt(key)];  // Define a cor atual
    } else if (mode === 'width' && key >= '1' && key <= '9') {
        lineWidth = parseInt(key);             // Define a largura atual
    } else if (key === 'k') {
        mode = 'color';       // Alterna para modo de cor
    } else if (key === 'e') {
        mode = 'width';       // Alterna para modo de espessura
    } else if (key === 'r') {
        drawMode = 'line';    // Alterna para modo de linha
    } else if (key === 't') {
        drawMode = 'triangle'; // Alterna para modo de triângulo
    }
});

// Configura o fundo branco inicial para o canvas
gl.clearColor(1.0, 1.0, 1.0, 1.0);   // Define a cor de fundo como branca
gl.clear(gl.COLOR_BUFFER_BIT);       // Limpa o canvas com a cor de fundo

// Exibe um ponto azul como linha inicial
drawLine(0, 0, 0, 0, colors[2],lineWidth[5]);
