// Dados de exemplo e configurações iniciais
const benfordLawPercentages = [0, 30.1, 17.6, 12.5, 9.7, 7.9, 6.7, 5.8, 5.1, 4.6];

// Elementos do DOM
const fetchButton = document.getElementById('fetch-data');
const analyzeButton = document.getElementById('analyze-data');
const resetButton = document.getElementById('reset-data');
const dataSourceSelect = document.getElementById('data-source');
const dataCountSelect = document.getElementById('data-count');
const loadingElement = document.getElementById('loading');
const dataTableBody = document.getElementById('data-table-body');

// Variáveis de estado
let currentData = [];
let firstDigitCount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
let benfordChart = null;

// URLs de APIs públicas
const apiEndpoints = {
    brasilcovid: 'https://api.brasil.io/v1/dataset/covid19/caso/data/?is_last=True&place_type=state',
    brpopulation: 'https://servicodados.ibge.gov.br/api/v1/projecoes/populacao',
    population: 'https://restcountries.com/v3.1/all?fields=population',
    stocks: 'https://api.polygon.io/v2/aggs/ticker/AAPL/range/1/day/2023-01-01/2023-06-01?apiKey=demo',
    earthquakes: 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2023-01-01&minmagnitude=4.5&limit=100',
    custom: '/assets/popbr.json'
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
            labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
            datasets: [
                {
                    label: 'Lei de Benford (Esperado)',
                    data: benfordLawPercentages.slice(1),
                    backgroundColor: 'rgba(57, 73, 171, 0.2)',
                    borderColor: 'rgba(57, 73, 171, 1)',
                    borderWidth: 2,
                    type: 'line',
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Dados Analisados (Observado)',
                    data: firstDigitCount.slice(1).map(count => 0),
                    backgroundColor: 'rgba(76, 175, 80, 0.7)',
                    borderColor: 'rgba(76, 175, 80, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
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
                        text: 'Primeiro Dígito'
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
                            return `${context.dataset.label}: ${context.raw.toFixed(1)}%`;
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
    const count = parseInt(dataCountSelect.value);
    console.log("Fonte: ", source, " Count: ", count);

    // Mostrar indicador de carregamento
    loadingElement.style.display = 'block';

    try {
        let data = [];
        if (source === 'custom') {
            const response = await fetch(apiEndpoints.custom);
            const pops = await response.json();
            const countpop = pops.length;
            console.log("Resposta ", response, " POPS: ", pops, " CountPOP:", countpop);
            data = pops
                .map(lin => lin[4])
                .filter(pops => pops > 0);
            console.log("Data: ",data)
        } else if (source === 'brasilcovid') {
            // API da COVID no Brasil
            const response = await fetch(apiEndpoints.brasilcovid);
            const countries = await response.json();

            // Extrair valores de população
            data = countries
                .slice(0, count)
                .map(country => country.brasilcovid)
                .filter(pop => pop > 0);

        } else if (source === 'brpopulation') {
            // API de população do Brasil
            const response = await fetch(apiEndpoints.brpopulation);
            const countries = await response.json();
            console.log(response);

            // Extrair valores de população
            data = countries
                .slice(0, count)
                .map(country => country.brpopulation)
                .filter(pop => pop > 0);

        } else if (source === 'population') {
            // API de população de países
            const response = await fetch(apiEndpoints.population);
            const countries = await response.json();

            // Extrair valores de população
            data = countries
                .slice(0, count)
                .map(country => country.population)
                .filter(country => country > 0);

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
                firstDigit: getFirstDigit(num)
            };
        });

        // Atualizar tabela
        updateDataTable();

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
                firstDigit: getFirstDigit(num)
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

        // Criar um número com esse primeiro dígito
        const magnitude = Math.floor(Math.random() * 6) + 1; // 1 a 6 dígitos
        const rest = Math.floor(Math.random() * Math.pow(10, magnitude - 1));
        const number = firstDigit * Math.pow(10, magnitude - 1) + rest;

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

// Obter o primeiro dígito significativo de um número
function getFirstDigit(number) {
    if (number === 0) return 0;

    let n = Math.abs(number);

    // Se o número for menor que 1, multiplicar por 10 até que seja >= 1
    while (n < 1) {
        n *= 10;
    }

    // Enquanto o número for >= 10, dividir por 10
    while (n >= 10) {
        n /= 10;
    }

    return Math.floor(n);
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
        digitCell.textContent = item.firstDigit;
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

    // Resetar contagem de dígitos
    firstDigitCount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    // Contar ocorrências de cada primeiro dígito
    currentData.forEach(item => {
        const digit = item.firstDigit;
        if (digit >= 1 && digit <= 9) {
            firstDigitCount[digit]++;
        }
    });

    // Calcular porcentagens
    const totalValidDigits = currentData.filter(item => item.firstDigit >= 1 && item.firstDigit <= 9).length;
    const observedPercentages = firstDigitCount.map(count =>
        totalValidDigits > 0 ? (count / totalValidDigits) * 100 : 0
    );

    // Atualizar gráfico
    benfordChart.data.datasets[1].data = observedPercentages.slice(1);
    benfordChart.update();
    console.log('Atualizar grafico com:', observedPercentages.slice(1));

    // Calcular métricas de conformidade
    calculateConformityMetrics(observedPercentages, totalValidDigits);
}

// Calcular métricas de conformidade
function calculateConformityMetrics(observedPercentages, totalValidDigits) {
    // Calcular desvio absoluto médio (MAD)
    let sumAbsoluteDeviation = 0;
    let maxDeviation = 0;
    let maxDeviationDigit = 0;

    for (let i = 1; i <= 9; i++) {
        const deviation = Math.abs(observedPercentages[i] - benfordLawPercentages[i]);
        sumAbsoluteDeviation += deviation;

        if (deviation > maxDeviation) {
            maxDeviation = deviation;
            maxDeviationDigit = i;
        }
    }

    const meanAbsoluteDeviation = sumAbsoluteDeviation / 9;

    // Calcular chi-quadrado
    let chiSquare = 0;
    for (let i = 1; i <= 9; i++) {
        const expected = (benfordLawPercentages[i] / 100) * totalValidDigits;
        const observed = firstDigitCount[i];
        chiSquare += Math.pow(observed - expected, 2) / expected;
    }

    // Encontrar dígitos mais e menos frequentes
    let mostFrequent = 1;
    let leastFrequent = 1;
    let maxCount = firstDigitCount[1];
    let minCount = firstDigitCount[1];

    for (let i = 2; i <= 9; i++) {
        if (firstDigitCount[i] > maxCount) {
            maxCount = firstDigitCount[i];
            mostFrequent = i;
        }
        if (firstDigitCount[i] < minCount) {
            minCount = firstDigitCount[i];
            leastFrequent = i;
        }
    }

    // Determinar nível de conformidade
    let conformityLevel, conformityClass;

    if (meanAbsoluteDeviation < 3) {
        conformityLevel = "Alta Conformidade";
        conformityClass = "high-conformity";
    } else if (meanAbsoluteDeviation < 6) {
        conformityLevel = "Conformidade Moderada";
        conformityClass = "medium-conformity";
    } else {
        conformityLevel = "Baixa Conformidade";
        conformityClass = "low-conformity";
    }

    // Atualizar interface com os resultados
    document.getElementById('conformity-value').textContent = conformityLevel;
    document.getElementById('conformity-indicator').className = `conformity-indicator ${conformityClass}`;
    document.getElementById('total-data').textContent = totalValidDigits;
    document.getElementById('max-deviation').textContent = `${maxDeviation.toFixed(1)}% (dígito ${maxDeviationDigit})`;
    document.getElementById('most-frequent').textContent = mostFrequent;
    document.getElementById('least-frequent').textContent = leastFrequent;
    document.getElementById('chi-square').textContent = chiSquare.toFixed(2);

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
    const dataControls = document.querySelector('.data-controls');
    const firstAlert = dataControls.querySelector('.alert');
    dataControls.insertBefore(alertDiv, firstAlert.nextSibling);

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
    firstDigitCount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    // Resetar gráfico
    benfordChart.data.datasets[1].data = firstDigitCount.slice(1).map(() => 0);
    benfordChart.update();

    // Resetar tabela
    dataTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Nenhum dado carregado ainda</td></tr>';

    // Resetar resultados
    document.getElementById('conformity-value').textContent = '--';
    document.getElementById('conformity-indicator').className = 'conformity-indicator';
    document.getElementById('total-data').textContent = '--';
    document.getElementById('max-deviation').textContent = '--';
    document.getElementById('most-frequent').textContent = '--';
    document.getElementById('least-frequent').textContent = '--';
    document.getElementById('chi-square').textContent = '--';

    showAlert('Análise resetada. Selecione uma fonte de dados e clique em "Buscar Dados" para começar uma nova análise.', 'info');
}

// Event Listeners
fetchButton.addEventListener('click', fetchDataFromAPI);
analyzeButton.addEventListener('click', analyzeData);
resetButton.addEventListener('click', resetAnalysis);

// Inicializar gráfico e aplicação
window.addEventListener('DOMContentLoaded', () => {
    initializeChart();
    showAlert('Selecione uma fonte de dados e clique em "Buscar Dados" para iniciar a análise.', 'info');
});