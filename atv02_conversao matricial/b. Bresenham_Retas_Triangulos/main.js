// Seleciona o elemento canvas e obtém o contexto WebGL para desenhar gráficos 2D/3D
const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl');

// Verifica se o WebGL está suportado pelo navegador
if (!gl) {
    throw new Error('WebGL não suportado');
}

// Define uma paleta de cores associada às teclas numéricas de 0 a 9
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

let points = [];             // Array para armazenar os pontos do triângulo ou linha
let currentColor = colors[2]; // Cor inicial (azul)
let drawMode = 'line';        // Modo inicial de desenho (linha)

// Código do Vertex Shader, responsável pela posição dos pontos
const vertexShaderSource = `
    attribute vec2 position;
    void main() {
        gl_Position = vec4(position, 0.0, 1.0); // Define a posição do vértice
        gl_PointSize = 5.0; // Define o tamanho do ponto
    }
`;

// Código do Fragment Shader, responsável pela cor dos pontos
const fragmentShaderSource = `
    precision mediump float;
    uniform vec3 color; // Recebe a cor como variável uniforme
    void main() {
        gl_FragColor = vec4(color, 1.0); // Aplica a cor ao ponto
    }
`;

// Função para criar e compilar um shader WebGL
function createShader(gl, type, source) {
    const shader = gl.createShader(type); // Cria o shader do tipo especificado
    gl.shaderSource(shader, source);      // Define o código-fonte do shader
    gl.compileShader(shader);             // Compila o shader
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { // Verifica a compilação
        console.error(gl.getShaderInfoLog(shader)); // Exibe erros de compilação
        gl.deleteShader(shader);
        return null;
    }
    return shader; // Retorna o shader compilado
}

// Compila os shaders e cria o programa WebGL
const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = gl.createProgram();       // Cria um programa WebGL
gl.attachShader(program, vertexShader);    // Associa o vertex shader ao programa
gl.attachShader(program, fragmentShader);  // Associa o fragment shader ao programa
gl.linkProgram(program);                   // Liga os shaders para formar o programa final

// Verifica se o programa foi linkado com sucesso
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program)); // Exibe erros de linkagem
    gl.deleteProgram(program);
}

// Ativa o programa WebGL para uso
gl.useProgram(program);

// Localiza o atributo de posição e o uniform de cor no shader
const positionAttributeLocation = gl.getAttribLocation(program, 'position');
const colorUniformLocation = gl.getUniformLocation(program, 'color');

// Cria um buffer de posição para armazenar os pontos a serem desenhados
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

// Ativa o atributo de posição e associa ao buffer
gl.enableVertexAttribArray(positionAttributeLocation);
gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

// Função para converter coordenadas de pixel para o espaço de coordenadas do WebGL
function pixelToClipSpace(x, y) {
    return [
        (x / canvas.width) * 2 - 1, // Converte coordenada x de pixel para clip space
        (y / canvas.height) * 2 - 1 // Converte coordenada y de pixel para clip space
    ];
}

// Função para desenhar uma linha entre dois pontos usando o algoritmo de Bresenham
function drawLine(p1, p2, color) {
    let x1 = p1.x;
    let y1 = p1.y;
    let x2 = p2.x;
    let y2 = p2.y;

    // Cálculo das diferenças e direções
    let dx = Math.abs(x2 - x1);
    let dy = Math.abs(y2 - y1);
    let sx = x1 < x2 ? 1 : -1;
    let sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;

    gl.uniform3fv(colorUniformLocation, color); // Define a cor da linha

    while (true) {
        // Converte o ponto atual para o espaço de coordenadas do WebGL
        const clipSpacePoint = pixelToClipSpace(x1, y1);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(clipSpacePoint), gl.STATIC_DRAW);
        gl.drawArrays(gl.POINTS, 0, 1); // Desenha um ponto

        if (x1 === x2 && y1 === y2) break; // Se chegou ao final, sai do loop

        const e2 = 2 * err;  // Multiplica o erro atual por 2 para ajudar a decidir a direção do próximo ponto

        // Verifica se o erro ajustado permite um avanço no eixo x
        if (e2 > -dy) {      
            err -= dy;      // Ajusta o erro, subtraindo a diferença de y (dy)
            x1 += sx;       // Avança um passo no eixo x na direção sx (1 ou -1)
        }

        // Verifica se o erro ajustado permite um avanço no eixo y
        if (e2 < dx) {       
            err += dx;      // Ajusta o erro, somando a diferença de x (dx)
            y1 += sy;       // Avança um passo no eixo y na direção sy (1 ou -1)
        }
    }
}

// Função para desenhar um triângulo a partir de três pontos dados
function drawTriangle(p1, p2, p3, color) {
    drawLine(p1, p2, color); // Desenha as três linhas que formam o triângulo
    drawLine(p2, p3, color);
    drawLine(p3, p1, color);
}

// Event listener para clique do mouse, que define pontos de início e fim para a linha ou triângulo
canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect(); // Obtém posição do canvas
    const x = event.clientX - rect.left;         // Ajusta coordenadas x e y
    const y = canvas.height - (event.clientY - rect.top);

    if (drawMode === 'line') { 
        if (points.length === 0) {
            points.push({ x, y });
        } else {
            drawLine(points[0], { x, y }, currentColor); // Desenha a linha
            points = []; // Limpa os pontos após o desenho
        }
    } else if (drawMode === 'triangle') {
        points.push({ x, y });
        if (points.length === 3) {
            drawTriangle(points[0], points[1], points[2], currentColor); // Desenha o triângulo
            points = []; // Limpa os pontos após o desenho
        }
    }
});

// Event listener para pressionar teclas, alterando a cor e o modo de desenho
document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (key >= '0' && key <= '9') {
        const index = parseInt(key);
        currentColor = colors[index]; // Define a cor com base na tecla
    } else if (key === 'r') { 
        drawMode = 'line'; // Altera para modo de linha
    } else if (key === 't') {
        drawMode = 'triangle'; // Altera para modo de triângulo
    }
});

// Configura o fundo inicial para o canvas
gl.clearColor(1.0, 1.0, 1.0, 1.0); // Branco
gl.clear(gl.COLOR_BUFFER_BIT);

// Desenha um ponto inicial azul para a linha
drawLine(0, 0, 0, 0, colors[2]); // Ponto inicial azul