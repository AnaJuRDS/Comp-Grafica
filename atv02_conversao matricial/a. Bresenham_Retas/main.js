// Seleciona o elemento canvas na página e obtém o contexto WebGL
const canvas = document.getElementById('canvas'); // Seleciona o elemento <canvas> usando seu ID
const gl = canvas.getContext('webgl'); // Obtém o contexto WebGL para renderizar gráficos 2D e 3D

// Verifica se o navegador suporta WebGL; caso contrário, lança um erro
if (!gl) {
    throw new Error('WebGL não suportado');
}

// Define as cores que podem ser usadas para desenhar, associadas às teclas de 0 a 9
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

let start = null;         // Armazena o ponto inicial da linha a ser desenhada
let end = null;           // Armazena o ponto final da linha a ser desenhada
let currentColor = colors[2]; // Cor inicial é azul (index 2 em 'colors')

// Vertex Shader: define a posição de cada vértice (ponto) no espaço de coordenadas WebGL
const vertexShaderSource = `
    attribute vec2 position;  // Atributo que representa a posição do ponto
    void main() {
        gl_Position = vec4(position, 0.0, 1.0); // Define a posição 3D do ponto no espaço de exibição
        gl_PointSize = 5.0; // Define o tamanho do ponto em pixels
    }
`;

// Fragment Shader: define a cor dos fragmentos (pixels) de cada ponto
const fragmentShaderSource = `
    precision mediump float;  // Define a precisão para operações em ponto flutuante
    uniform vec3 color;       // Uniform que representa a cor do ponto
    void main() {
        gl_FragColor = vec4(color, 1.0); // Define a cor e a opacidade do ponto
    }
`;

// Função para criar um shader (vertex ou fragment) a partir do código fonte
function createShader(gl, type, source) {
    const shader = gl.createShader(type); // Cria um novo shader do tipo especificado
    gl.shaderSource(shader, source);      // Define o código fonte do shader
    gl.compileShader(shader);             // Compila o shader

    // Verifica se a compilação foi bem-sucedida; caso contrário, exibe o erro
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader); // Exclui o shader com erro de compilação
        return null;
    }
    return shader; // Retorna o shader compilado
}

// Compila e cria o programa WebGL a partir dos shaders vertex e fragment
const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = gl.createProgram(); // Cria um programa WebGL
gl.attachShader(program, vertexShader); // Anexa o vertex shader ao programa
gl.attachShader(program, fragmentShader); // Anexa o fragment shader ao programa
gl.linkProgram(program); // Linka os shaders no programa para que possam ser usados juntos

// Verifica se o programa foi linkado corretamente
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

// Ativa o programa WebGL para ser usado nas operações de renderização
gl.useProgram(program);

// Localiza a posição do atributo 'position' e do uniform 'color' no programa
const positionAttributeLocation = gl.getAttribLocation(program, 'position'); // Atributo para posição
const colorUniformLocation = gl.getUniformLocation(program, 'color'); // Uniform para cor

// Cria um buffer de posição e associa ao contexto WebGL para armazenar dados de posição
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer); // Associa o buffer ao contexto WebGL

// Ativa o atributo de posição e define como ele será lido a partir do buffer
gl.enableVertexAttribArray(positionAttributeLocation);
gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0); // Configura o layout do buffer

// Converte coordenadas de pixel para o sistema de coordenadas de WebGL (clip space)
function pixelToClipSpace(x, y) {
    return [
        (x / canvas.width) * 2 - 1,  // Converte a coordenada x de pixel para clip space (-1 a 1)
        (y / canvas.height) * 2 - 1  // Converte a coordenada y de pixel para clip space (-1 a 1)
    ];
}

// Desenha uma linha entre os pontos (x0, y0) e (x1, y1) com a cor especificada usando o algoritmo de Bresenham
function drawLine(x0, y0, x1, y1, color) {
    const points = []; // Array que armazena todos os pontos ao longo da linha

    // Cálculo de diferenças e direções entre os pontos
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = x0 < x1 ? 1 : -1;
    let sy = y0 < y1 ? 1 : -1;
    let err = dx - dy; // Variável de erro usada para decidir a direção do próximo ponto

    // Algoritmo de Bresenham para interpolação de pontos
    while (true) {
        // Adiciona as coordenadas em clip space do ponto atual ao array
        points.push(pixelToClipSpace(x0, y0)[0]);
        points.push(pixelToClipSpace(x0, y0)[1]);
        
        if (x0 === x1 && y0 === y1) break; // Termina o loop se chegou ao ponto final

        let e2 = err * 2;  // Multiplica o erro atual por 2 para ajudar a decidir a direção do próximo ponto
        // Verifica se o erro ajustado permite um avanço no eixo x
        if (e2 > -dy) {      
            err -= dy;      // Ajusta o erro, subtraindo a diferença de y (dy)
            x0 += sx;       // Avança um passo no eixo x na direção sx (1 ou -1)            }
        }
        // Verifica se o erro ajustado permite um avanço no eixo 
        if (e2 < dx) {       
            err += dx;      // Ajusta o erro, somando a diferença de x (dx)                y0 += sy;       // Avança um passo no eixo y na direção sy (1 ou -1)
            y0 += sy;
        }
    }

    // Limpa o buffer de cor antes de desenhar
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform3fv(colorUniformLocation, color); // Define a cor da linha
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW); // Passa os pontos para o buffer
    gl.drawArrays(gl.POINTS, 0, points.length / 2); // Desenha os pontos no canvas
}

// Detecta o clique do mouse no canvas para definir os pontos inicial e final da linha
canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect(); // Obtém as dimensões e posição do canvas
    const x = event.clientX - rect.left; // Converte coordenada x do mouse para dentro do canvas
    const y = canvas.height - (event.clientY - rect.top); // Converte coordenada y

    if (!start) {
        start = { x, y }; // Define o ponto inicial se ainda não houver um
    } else {
        end = { x, y }; // Define o ponto final e desenha a linha
        drawLine(start.x, start.y, end.x, end.y, currentColor);
        start = null; // Reinicia a variável 'start' para o próximo clique
    }
});

// Muda a cor da linha quando uma tecla numérica (0-9) é pressionada
document.addEventListener('keydown', (event) => {
    const key = event.key;
    if (key >= '0' && key <= '9') {
        const index = parseInt(key);
        currentColor = colors[index]; // Atualiza a cor atual
    }
});

// Configura o fundo branco inicial para o canvas
gl.clearColor(1.0, 1.0, 1.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);

// Desenha uma linha inicial entre (0, 0) e (0, 0) na cor azul
drawLine(0, 0, 0, 0, colors[2]); // Exibe um ponto azul como linha inicial
