// Dados de exemplo e configurações iniciais
const benfordLawPercentagesSecond = [
    11.97, 
    11.39, 
    10.89, 
    10.43, 
    10.03, 
    9.68, 
    9.34, 
    9.04, 
    8.76,
    8.50
];

// Elementos do DOM
const fetchButton = document.getElementById('fetchDataBtn');
const analyzeButton = document.getElementById('analyzeDataBtn');
const resetButton = document.getElementById('resetDataBtn');
const dataSourceSelect = document.getElementById('data-source');
const dataCountSelect = document.getElementById('data-count');
const loadingElement = document.getElementById('loading');
const dataTableBody = document.getElementById('data-table-body');

// Variáveis de estado
let currentData = [];
let secondDigitCount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
let benfordChart = null;

// URLs de APIs públicas
const apiEndpoints = {
    brareacitiesgit: 'https://arjios.github.io/benford/assets/areacitiesbr.json',
    brpopulation: 'https://arjios.github.io/benford/assets/popbrasil.json',
    globalpopgit: 'https://arjios.github.io/benford/assets/popglobal.json',
    accountgit: 'https://arjios.github.io/benford/assets/condominio.json',
    custom: 'https://arjios.github.io/benford/assets/popbr.json',
    mortebr: 'https://arjios.github.io/benford/assets/mortebr.json',
    brareacities: '../../assets/areacitiesbr.json',
    gitcustomOld: '../../assets/popbr.json',
    gitcustom: '../../assets/popbrasil.json',
    account: '../../assets/condominio.json',
    globalpop: './assets/popglobal.json'   
};


// Inicializar gráfico
function initializeChart() {
    const ctx = document.getElementById('benfordChart').getContext('2d');

    if (benfordChart) {
        benfordChart.destroy();
    }

    benfordChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
            datasets: [
                {
                    label: 'Lei de Benford (Esperado)',
                    data: benfordLawPercentagesSecond.slice(0),
                    backgroundColor: 'rgba(57, 73, 171, 0.2)',
                    borderColor: 'rgba(57, 73, 171, 1)',
                    borderWidth: 2,
                    type: 'line',
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Dados Analisados (Observado)',
                    data: secondDigitCount.slice(0).map(count => 0),
                    backgroundColor: 'rgba(76, 175, 80, 0.7)',
                    borderColor: 'rgba(76, 175, 80, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Porcentagem (%)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Segundo Dígito'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.dataset.label}: ${context.raw.toFixed(2)}%`;
                        }
                    }
                }
            }
        }
    });
}

// Buscar dados da API selecionada
async function fetchDataFromAPI() {
    const source = dataSourceSelect.value;
    if(source !== 'custom' && source !== 'mortebr') {
        showAlert('As APIs de COVID e população do Brasil ainda não estão implementadas. Usando dados simulados para demonstração.', 'warning');
    }
    document.getElementById("chartChoice").innerText = 'Grafico da Distribuição do Segundo Digito';
    count = 0;
    console.log("Fonte: ", source, " Count: ", count);

    // Mostrar indicador de carregamento
    loadingElement.style.display = 'block';
    try {
        let data = [];
        if (source === 'custom') {
            console.log("Custom");
            document.getElementById("chartChoice").innerText = 'Grafico da Distribuição do Segundo Digito da População Municipios do Brasil';
            const response = await fetch(apiEndpoints.gitcustom);
            const pops = await response.json();
            const countpop = pops.length;
            console.log("Resposta ", response, " POPS: ", pops, " CountPOP:", countpop);
            data = pops
                .map(lin => lin[4])
                .filter(pops => pops > 0);
        } else if (source === 'mortebr') {
            // Inserir o cabeçalho do grafico para a API de mortalidade
            document.getElementById("chartChoice").innerText = 'Grafico da Distribuição do Segundo Digito da Mortalidade da População do Brasil';
            const response = await fetch(apiEndpoints.mortebr);
            const pops = await response.json();
            const countmorte = pops.length;
            console.log("Resposta ", response, " POPS: ", pops, " CountMORTE:", countmorte);
            data = pops
                .map(lin => lin[1])
                .filter(pops => pops > 0);

        } else if (source === 'accounting') {
            // Inserir o cabeçalho do grafico para a API do Grafico Contabil
            console.log("Account");
            document.getElementById("chartChoice").innerText = 'Grafico da Distribuição do Segundo Digito de uma Conta Contabil';
            const response = await fetch(apiEndpoints.account);
            const pops = await response.json();
            const results = pops.length;
            data = pops
                .map(lin => lin[1])
                .filter(pop => pop > 0);


        } else if (source === 'brareacity') {
            // Inserir o cabeçalho do grafico para a API de Areas das Cidades do Brasil
            console.log("Area das Cidades Brasileiras");
            document.getElementById("chartChoice").innerText = 'Grafico da Distribuição do Segundo Digito da Area dos Municipios do Brasil';
            const response = await fetch(apiEndpoints.brareacitiesgit);
            const areas = await response.json();
            const results = areas.length;
            // Extrair valores de area
            data = areas
                .map(area => area[5])
                .filter(pop => pop > 0);

        } else if (source === 'brpopulation') {
            // API de população do Brasil
            console.log("População das Cidades Brasileiras");
            const response = await fetch(apiEndpoints.brpopulation);
            const countries = await response.json();
            // Extrair valores de população
            data = countries
                .slice(0, count)
                .map(country => country.brpopulation)
                .filter(pop => pop > 0);

        } else if (source === 'globalpop') {
            // Inserir o cabeçalho do grafico para a API de população global
            console.log("População Global");
            document.getElementById("chartChoice").innerText = 'Grafico da Distribuição do Segundo Digito da População Global';
            const response = await fetch(apiEndpoints.globalpopgit);
            const countries = await response.json();
            const results = countries.length;
            console.log("Resposta ", response, " Countries: ", countries, " Results:", results);
            // Extrair valores de população
            data = countries
                .map(country => country[9])
                .filter(pop => pop > 0);
            console.log(data[9])
        } else if (source === 'stocks') {
            // API de preços de ações (usando dados simulados para evitar limite de API)
            data = generateStockPrices(count);
        } else if (source === 'earthquakes') {
            // API de terremotos (usando dados simulados para evitar limite de API)
            data = generateEarthquakeMagnitudes(count);
        }

        // Processar dados
        currentData = data.map(value => {
            const num = Math.abs(parseFloat(value));
            return {
                raw: value,
                processed: num,
                secondDigit: getSecondDigit(num)
            };
        });

        // Esconder indicador de carregamento
        loadingElement.style.display = 'none';

        // Mostrar mensagem de sucesso
        showAlert(`Dados carregados com sucesso! ${currentData.length} registros obtidos.`, 'success');

    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        loadingElement.style.display = 'none';

        // Em caso de erro, usar dados simulados
        currentData = generateMockData(count).map(value => {
            const num = Math.abs(parseFloat(value));
            return {
                raw: value,
                processed: num,
                secondDigit: getSecondDigit(num)
            };
        });

        updateDataTable();
        showAlert('Usando dados simulados devido a limitação da API. Os resultados são para demonstração.', 'warning');
    }
}

// Gerar dados simulados para demonstração
function generateMockData(count) {
    const data = [];

    // Gerar dados que seguem a Lei de Benford
    for (let i = 0; i < count; i++) {
        // Probabilidades baseadas na Lei de Benford
        const rand = Math.random();
        let firstDigit;

        if (rand < 0.301) firstDigit = 1;
        else if (rand < 0.477) firstDigit = 2;
        else if (rand < 0.602) firstDigit = 3;
        else if (rand < 0.699) firstDigit = 4;
        else if (rand < 0.778) firstDigit = 5;
        else if (rand < 0.845) firstDigit = 6;
        else if (rand < 0.903) firstDigit = 7;
        else if (rand < 0.954) firstDigit = 8;
        else firstDigit = 9;

        // Escolher segundo digito
        const rand2 = Math.random()
        let cumulative = 0;

        for (let d = 0; d <= 9; d++) {
            let prob = 0;
            for(let fd=1; fd<=9; fd++) {
                prob += Math.log10(1 + 1 / (10 * fd + d));
            }
            cumulative += prob;
            if(rand2 < cumulative) {
                secondDigit = d;
                break;
            }
        }
        const magnitude = Math.floor(Math.random() * 6) + 2; // de 2 a 6
        let number;
        if(magnitude === 2) {
            number = firstDigit * 10 + secondDigit;
        } else {
            const rest = Math.floor(Math.random() * Math.pow(10, magnitude - 2));
            number = (firstDigit * 10 + secondDigit) * Math.pow(10, magnitude - 2) + rest;
        }
        data.push(number);
    }
    return data;
}

// Gerar preços de ações simulados
function generateStockPrices(count) {
    const prices = [];
    let price = 100; // Preço inicial

    for (let i = 0; i < count; i++) {
        // Variação aleatória entre -5% e +5%
        const change = (Math.random() * 0.1) - 0.05;
        price = price * (1 + change);
        prices.push(price.toFixed(2));
    }

    return prices;
}

// Gerar magnitudes de terremotos simuladas
function generateEarthquakeMagnitudes(count) {
    const magnitudes = [];

    for (let i = 0; i < count; i++) {
        // Magnitudes seguem aproximadamente a Lei de Benford
        const rand = Math.random();
        let firstDigit;

        if (rand < 0.301) firstDigit = 1;
        else if (rand < 0.477) firstDigit = 2;
        else if (rand < 0.602) firstDigit = 3;
        else if (rand < 0.699) firstDigit = 4;
        else if (rand < 0.778) firstDigit = 5;
        else if (rand < 0.845) firstDigit = 6;
        else if (rand < 0.903) firstDigit = 7;
        else if (rand < 0.954) firstDigit = 8;
        else firstDigit = 9;

        // Magnitude entre 4.0 e 9.9
        const decimal = Math.random().toFixed(1);
        const magnitude = parseFloat(`${firstDigit}.${decimal.substring(2, 3)}`);

        magnitudes.push(magnitude);
    }

    return magnitudes;
}

// Obter o segundo dígito significativo de um número
function getSecondDigit(number) {
if (!number || isNaN(number)) return -1;

    // Converte para string numérico apenas com os dígitos significativos
    const cleanedStr = Math.abs(number).toString().replace('.', '').replace(/^0+/, '');
    
    // Precisa ter pelo menos 2 dígitos significativos
    if (cleanedStr.length < 2) return -1;
    
    return parseInt(cleanedStr[1], 10);
}

// Atualizar tabela com os dados obtidos
function updateDataTable() {
    dataTableBody.innerHTML = '';

    // Limitar a exibição a 20 registros para não sobrecarregar a UI
    const displayLimit = 20;
    const displayData = currentData.slice(0, displayLimit);

    displayData.forEach((item, index) => {
        const row = document.createElement('tr');

        const indexCell = document.createElement('td');
        indexCell.textContent = index + 1;

        const valueCell = document.createElement('td');
        valueCell.textContent = typeof item.raw === 'number' ?
            item.raw.toLocaleString('pt-BR') :
            item.raw;

        const digitCell = document.createElement('td');
        digitCell.textContent = item.secondDigit;
        digitCell.style.fontWeight = 'bold';
        digitCell.style.color = '#1a237e';

        row.appendChild(indexCell);
        row.appendChild(valueCell);
        row.appendChild(digitCell);

        dataTableBody.appendChild(row);
    });

    // Adicionar mensagem se houver mais dados
    if (currentData.length > displayLimit) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 3;
        cell.textContent = `... e mais ${currentData.length - displayLimit} registros`;
        cell.style.textAlign = 'center';
        cell.style.fontStyle = 'italic';
        cell.style.color = '#666';
        row.appendChild(cell);
        dataTableBody.appendChild(row);
    }
}

// Analisar os dados e verificar conformidade com a Lei de Benford
function analyzeData() {
    if (currentData.length === 0) {
        showAlert('Nenhum dado disponível para análise. Por favor, busque dados primeiro.', 'warning');
        return;
    }

    console.log("Analisando dados: ", currentData);
    secondDigitCount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    // Resetar contagem dos segundos dígitos
    let totalValidDigits = 0;
    currentData.forEach(item => {
        const digit = item.secondDigit;
        if (digit >= 0 && digit <= 9) {
            secondDigitCount[digit]++;
            totalValidDigits++;
        }
    });

    // Calcular porcentagens
    if (totalValidDigits === 0) {
        showAlert('Nenhum dígito válido encontrado nos dados.', 'danger');
        return;
    }
    const observedPercentages = secondDigitCount.map(count => (count / totalValidDigits) * 100);
    // Atualizar gráfico
    if (benfordChart) {
        benfordChart.data.datasets[1].data = observedPercentages;
        benfordChart.update();
    }

    // Calcular métricas de conformidade
    calculateConformityMetrics(observedPercentages, totalValidDigits);
}

// Calcular métricas de conformidade
function calculateConformityMetrics(observedPercentages, totalValidDigits) {
    // Calcular desvio absoluto médio (MAD)
    let sumAbsoluteDeviation = 0;
    let maxDeviation = 0;
    let maxDeviationDigit = 0;

    for (let i = 0; i <= 9; i++) {
        const deviation = Math.abs(observedPercentages[i] - benfordLawPercentagesSecond[i]);
        sumAbsoluteDeviation += deviation;

        if (deviation > maxDeviation) {
            maxDeviation = deviation;
            maxDeviationDigit = i;
        }
    }

    const meanAbsoluteDeviation = sumAbsoluteDeviation / 10;

    // Calcular qui-quadrado
    let chiSquare = 0;
    for (let i = 0; i <= 9; i++) {
        const expectedCount = (benfordLawPercentagesSecond[i] / 100) * totalValidDigits;
        const observedCount = secondDigitCount[i];
        if (expectedCount > 0) {
            chiSquare += Math.pow(observedCount - expectedCount, 2) / expectedCount;
        }
    }

    // Calcular SSD para segundos dígitos
    let ssd = 0;
    for (let d = 0; d <= 9; d++) {
        const deviation = observedPercentages[d] - benfordLawPercentagesSecond[d];
        ssd += Math.pow(deviation, 2);
    }

    // Encontrar dígitos mais e menos frequentes
    let mostFrequent = 0;
    let leastFrequent = 0;
    let maxCount = secondDigitCount[0];
    let minCount = secondDigitCount[0];

    for (let i = 2; i <= 9; i++) {
        if (secondDigitCount[i] > maxCount) {
            maxCount = secondDigitCount[i];
            mostFrequent = i;
        }
        if (secondDigitCount[i] < minCount) {
            minCount = secondDigitCount[i];
            leastFrequent = i;
        }
    }

    // Determinar nível de conformidade
    let conformityLevel, conformityClass;

    if (chiSquare < 16.92 && ssd <= 2.0) {
        conformityLevel = "Alta";
        conformityClass = "high-conformity";
    } else if (chiSquare < 25.0 && ssd <= 5.0) {
        conformityLevel = "Moderada";
        conformityClass = "medium-conformity";
    } else {
        conformityLevel = "Baixa";
        conformityClass = "low-conformity";
    }

    // Atualizar interface com os resultados
    document.getElementById('accordanceIndicator').className = `conformity-indicator ${conformityClass}`
    document.getElementById('accordance').textContent = conformityLevel;
    document.getElementById('datas').innerText = totalValidDigits;
    document.getElementById('deviation').innerText = `${maxDeviation.toFixed(1)}% (dígito ${maxDeviationDigit})`;
    document.getElementById('moreOften').textContent = mostFrequent;
    document.getElementById('lessOften').textContent = leastFrequent;
    document.getElementById('xSquare').textContent = chiSquare.toFixed(2);
    document.getElementById('ssd').textContent = ssd.toFixed(4);

    // Mostrar mensagem baseada nos resultados
    let alertMessage = '';
    let alertType = 'info';

    if (conformityClass === 'high-conformity') {
        alertMessage = 'Os dados apresentam alta conformidade com a Lei de Benford, o que sugere que são naturais/não manipulados.';
        alertType = 'success';
    } else if (conformityClass === 'medium-conformity') {
        alertMessage = 'Os dados apresentam conformidade moderada com a Lei de Benford. Pode ser necessário análise adicional.';
        alertType = 'info';
    } else {
        alertMessage = 'Os dados apresentam baixa conformidade com a Lei de Benford. Isso pode indicar possível manipulação ou dados não naturais.';
        alertType = 'warning';
    }

    showAlert(alertMessage, alertType);
}

// Mostrar alerta na interface
function showAlert(message, type) {
    // Remover alertas anteriores
    const existingAlerts = document.querySelectorAll('.alert:not(.alert-info)');
    existingAlerts.forEach(alert => alert.remove());

    // Criar novo alerta
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;

    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'warning') icon = 'exclamation-triangle';

    alertDiv.innerHTML = `
                <i class="fas fa-${icon}"></i>
                <div>${message}</div>
            `;

    // Inserir após o primeiro alerta de informação
//    const dataControls = document.querySelector('.data-controls');
//    const firstAlert = dataControls.querySelector('.alert');
//    dataControls.insertBefore(alertDiv, firstAlert.nextSibling);

    // Remover alerta após 10 segundos
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 10000);
}

// Resetar análise
function resetAnalysis() {
    currentData = [];
    secondDigitCount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    // Resetar gráfico
    benfordChart.data.datasets[1].data = secondDigitCount.slice(1).map(() => 0);
    benfordChart.update();

    // Resetar tabela
//    dataTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Nenhum dado carregado ainda</td></tr>';

    // Resetar titulo do grafico
    document.getElementById("chartChoice").innerText = 'Grafico da Distribuição do Segundo Digito';

    // Resetar resultados
    document.getElementById('accordance').textContent = '____';
    document.getElementById('accordanceIndicator').className = 'accordanceIndicator';
    document.getElementById('datas').textContent = '____';
    document.getElementById('deviation').textContent = '____';
    document.getElementById('moreOften').textContent = '____';
    document.getElementById('lessOften').textContent = '____';
    document.getElementById('xSquare').textContent = '____';
    document.getElementById('ssd').textContent = '____';

    showAlert('Análise resetada. Selecione uma fonte de dados e clique em "Buscar Dados" para começar uma nova análise.', 'info');
}

// Event Listeners
fetchButton.addEventListener('click', fetchDataFromAPI);
analyzeButton.addEventListener('click', analyzeData);
resetButton.addEventListener('click', resetAnalysis);
initializeChart();
fetchDataFromAPI();
analyzeData();

// Inicializar gráfico e aplicação
window.addEventListener('DOMContentLoaded', () => {
    initializeChart();
    showAlert('Selecione uma fonte de dados e clique em "Buscar Dados" para iniciar a análise.', 'info');
});