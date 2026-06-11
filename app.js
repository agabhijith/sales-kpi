// Application State and Mock Data
let transactions = [];
let trendChartInstance = null;
let regionChartInstance = null;

// Constant Lists for Mock Generation
const CUSTOMERS = [
  "Acme Corp", "Globex Corporation", "Initech", "Umbrella Corp", "Cyberdyne Systems",
  "Hooli", "Vehement Capital", "Soylent Corp", "Tyrell Corp", "Oscorp Industries",
  "Stark Enterprises", "Dunder Mifflin", "Vandelay Industries", "Wayne Enterprises",
  "Aperture Science", "Sterling Cooper", "Prestige Worldwide", "Virtucon", "Gringotts"
];

const REGIONS = ["North America", "Europe", "Asia Pacific", "Latin America"];
const SOURCES = ["Direct", "Organic Search", "Paid Ad", "Social Media", "Email Referral"];
const STATUSES = ["completed", "processing", "cancelled"];

// Initialize Lucide Icons
function initIcons() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Generate Mock Data Relative to Current Date
function generateMockData() {
  const data = [];
  const now = new Date();
  
  // Generate around 120 transactions spanning the last 120 days
  for (let i = 0; i < 120; i++) {
    // Distribute transactions back in time (more dense recently)
    const daysAgo = Math.floor(Math.pow(Math.random(), 1.5) * 120);
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    // Add random hour/minutes to make it look realistic
    date.setHours(Math.floor(Math.random() * 12) + 9); // Business hours
    date.setMinutes(Math.floor(Math.random() * 60));
    
    const customer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
    const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
    const source = SOURCES[Math.floor(Math.random() * SOURCES.length)];
    
    // Status probability: 80% completed, 14% processing, 6% cancelled
    const randStatus = Math.random();
    const status = randStatus < 0.80 ? "completed" : (randStatus < 0.94 ? "processing" : "cancelled");
    
    // Amount range based on customer (larger accounts get larger tickets)
    let baseAmount = 150 + Math.random() * 1500;
    if (customer.includes("Enterprises") || customer.includes("Corp") || customer.includes("Capital")) {
      baseAmount *= 3.5;
    }
    const amount = parseFloat(baseAmount.toFixed(2));
    
    data.push({
      id: `TXN-${10000 + i}`,
      date,
      customer,
      amount,
      region,
      source,
      status
    });
  }
  
  // Sort by date descending
  return data.sort((a, b) => b.date - a.date);
}

// Helper to filter transactions by date range
function getTransactionsForRange(startDate, endDate) {
  return transactions.filter(t => t.date >= startDate && t.date <= endDate);
}

// Get metrics for a specific transaction set
function calculateMetrics(dataset) {
  const ordersCount = dataset.filter(t => t.status === "completed").length;
  const totalRevenue = dataset
    .filter(t => t.status !== "cancelled")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const aov = ordersCount > 0 ? (totalRevenue / ordersCount) : 0;
  
  // Simulate visitor sessions proportional to completed orders (approx 2.5% conversion standard)
  // We use standard multipliers with random noise to keep it realistic
  const baseSessions = dataset.length * 35;
  const sessions = baseSessions > 0 ? baseSessions + Math.floor(Math.random() * (baseSessions * 0.1)) : 100;
  const conversionRate = (ordersCount / sessions) * 100;

  return {
    revenue: totalRevenue,
    orders: ordersCount,
    aov: aov,
    conversion: conversionRate
  };
}

// Update KPI UI Elements
function updateKPIs(timeframe) {
  const now = new Date();
  let startCurrent, startPrevious;
  
  switch(timeframe) {
    case '7days':
      startCurrent = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startPrevious = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      break;
    case '30days':
      startCurrent = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      startPrevious = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startCurrent = new Date(now.getFullYear(), 0, 1);
      // Previous year same period
      startPrevious = new Date(now.getFullYear() - 1, 0, 1);
      break;
    case 'all':
    default:
      startCurrent = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000); // Earliest transaction
      startPrevious = null; // No previous comparison for all time
      break;
  }

  const currentDataset = getTransactionsForRange(startCurrent, now);
  const currentMetrics = calculateMetrics(currentDataset);
  
  let previousMetrics = null;
  if (startPrevious) {
    // Filter the previous block of time
    const endPrevious = startCurrent;
    const previousDataset = getTransactionsForRange(startPrevious, endPrevious);
    previousMetrics = calculateMetrics(previousDataset);
  }

  // Helper to format currency
  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  
  // Update Current Values
  document.getElementById('kpi-revenue').innerText = formatCurrency(currentMetrics.revenue);
  document.getElementById('kpi-orders').innerText = currentMetrics.orders.toLocaleString();
  document.getElementById('kpi-aov').innerText = formatCurrency(currentMetrics.aov);
  document.getElementById('kpi-conversion').innerText = `${currentMetrics.conversion.toFixed(2)}%`;

  // Update Trends
  updateTrendUI('trend-revenue', currentMetrics.revenue, previousMetrics ? previousMetrics.revenue : null);
  updateTrendUI('trend-orders', currentMetrics.orders, previousMetrics ? previousMetrics.orders : null);
  updateTrendUI('trend-aov', currentMetrics.aov, previousMetrics ? previousMetrics.aov : null);
  updateTrendUI('trend-conversion', currentMetrics.conversion, previousMetrics ? previousMetrics.conversion : null);
}

function updateTrendUI(elementId, current, previous) {
  const container = document.getElementById(elementId);
  if (previous === null || previous === 0) {
    container.className = "kpi-trend";
    container.innerHTML = `<i data-lucide="minus"></i><span>No comparison data</span>`;
    initIcons();
    return;
  }

  const diffPercent = ((current - previous) / previous) * 100;
  const isPositive = diffPercent >= 0;
  
  container.className = `kpi-trend ${isPositive ? 'trend-up' : 'trend-down'}`;
  container.innerHTML = `
    <i data-lucide="${isPositive ? 'trending-up' : 'trending-down'}"></i>
    <span>${isPositive ? '+' : ''}${diffPercent.toFixed(1)}% vs last period</span>
  `;
  initIcons();
}

// Chart.js - Render Charts
function updateCharts(timeframe) {
  const now = new Date();
  let startCurrent;
  
  switch(timeframe) {
    case '7days':
      startCurrent = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30days':
      startCurrent = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startCurrent = new Date(now.getFullYear(), 0, 1);
      break;
    case 'all':
    default:
      startCurrent = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);
      break;
  }

  const dataset = getTransactionsForRange(startCurrent, now).filter(t => t.status !== 'cancelled');

  renderTrendChart(dataset, timeframe);
  renderRegionChart(dataset);
}

function renderTrendChart(dataset, timeframe) {
  // Aggregate sales by date intervals depending on timeframe
  const labels = [];
  const values = [];
  
  if (timeframe === '7days') {
    // Daily view
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      labels.push(dayStr);
      
      // Sum revenue for that day
      const daySum = dataset
        .filter(t => t.date.toDateString() === d.toDateString())
        .reduce((sum, t) => sum + t.amount, 0);
      values.push(parseFloat(daySum.toFixed(2)));
    }
  } else if (timeframe === '30days') {
    // 30 days - group in 5-day intervals for smoother chart, or daily. Daily with 30 points is fine and interactive!
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      labels.push(dayStr);
      
      const daySum = dataset
        .filter(t => t.date.toDateString() === d.toDateString())
        .reduce((sum, t) => sum + t.amount, 0);
      values.push(parseFloat(daySum.toFixed(2)));
    }
  } else {
    // Month aggregation for Year/All
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    
    // Collect last 6 months or all months in the year
    const monthsRange = timeframe === 'year' ? now.getMonth() + 1 : 6;
    for (let i = monthsRange - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(now.getMonth() - i);
      const mName = months[d.getMonth()];
      labels.push(mName);
      
      const mSum = dataset
        .filter(t => t.date.getMonth() === d.getMonth() && t.date.getFullYear() === d.getFullYear())
        .reduce((sum, t) => sum + t.amount, 0);
      values.push(parseFloat(mSum.toFixed(2)));
    }
  }

  // Draw chart
  const ctx = document.getElementById('trendChart').getContext('2d');
  
  if (trendChartInstance) {
    trendChartInstance.destroy();
  }

  // Create gradient background for line area
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
  gradient.addColorStop(1, 'rgba(139, 92, 246, 0.0)');

  trendChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Sales Revenue',
        data: values,
        borderColor: '#8b5cf6',
        borderWidth: 3,
        backgroundColor: gradient,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#8b5cf6',
        pointBorderColor: '#fff',
        pointHoverRadius: 7,
        pointHoverBackgroundColor: '#8b5cf6',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        pointRadius: timeframe === '30days' ? 1.5 : 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { family: 'Outfit', size: 13, weight: '600' },
          bodyFont: { family: 'Outfit', size: 12 },
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: function(context) {
              return ` Revenue: $${context.raw.toLocaleString()}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { family: 'Outfit', size: 11 } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: {
            color: 'rgba(255, 255, 255, 0.5)',
            font: { family: 'Outfit', size: 11 },
            callback: function(value) { return '$' + value; }
          }
        }
      }
    }
  });
}

function renderRegionChart(dataset) {
  // Aggregate sales by region
  const regionSums = {};
  REGIONS.forEach(r => regionSums[r] = 0);
  
  dataset.forEach(t => {
    if (regionSums[t.region] !== undefined) {
      regionSums[t.region] += t.amount;
    }
  });

  const labels = Object.keys(regionSums);
  const values = Object.values(regionSums).map(v => parseFloat(v.toFixed(2)));

  const ctx = document.getElementById('regionChart').getContext('2d');
  
  if (regionChartInstance) {
    regionChartInstance.destroy();
  }

  // Create emerald gradient for the bars
  const gradient = ctx.createLinearGradient(0, 0, 300, 0);
  gradient.addColorStop(0, 'rgba(16, 185, 129, 0.9)');
  gradient.addColorStop(1, 'rgba(16, 185, 129, 0.3)');

  regionChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Revenue by Region',
        data: values,
        backgroundColor: gradient,
        borderRadius: 6,
        borderWidth: 0,
        barThickness: 20
      }]
    },
    options: {
      indexAxis: 'y', // Makes it horizontal
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { family: 'Outfit', size: 13, weight: '600' },
          bodyFont: { family: 'Outfit', size: 12 },
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: function(context) {
              return ` Revenue: $${context.raw.toLocaleString()}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: {
            color: 'rgba(255, 255, 255, 0.5)',
            font: { family: 'Outfit', size: 11 },
            callback: function(value) { return '$' + value; }
          }
        },
        y: {
          grid: { display: false },
          ticks: { color: 'rgba(255, 255, 255, 0.7)', font: { family: 'Outfit', size: 12 } }
        }
      }
    }
  });
}

// Render Table Rows
function renderTable() {
  const searchQuery = document.getElementById('search-input').value.toLowerCase();
  const regionFilter = document.getElementById('region-filter').value;
  const statusFilter = document.getElementById('status-filter').value;
  
  const tbody = document.getElementById('sales-tbody');
  tbody.innerHTML = '';

  const filtered = transactions.filter(t => {
    const matchesSearch = t.customer.toLowerCase().includes(searchQuery) || t.region.toLowerCase().includes(searchQuery);
    const matchesRegion = regionFilter === 'all' || t.region === regionFilter;
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesRegion && matchesStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">
          No matching transaction records found.
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(t => {
    const row = document.createElement('tr');
    
    // Formatting date
    const dateFormatted = t.date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    row.innerHTML = `
      <td style="font-weight: 500;">${dateFormatted}</td>
      <td style="color: var(--text-main); font-weight: 600;">${t.customer}</td>
      <td>
        <span style="display: flex; align-items: center; gap: 0.35rem;">
          <i data-lucide="map-pin" style="width: 14px; height: 14px; color: var(--text-muted);"></i>
          ${t.region}
        </span>
      </td>
      <td>
        <span style="font-size: 0.8rem; background: rgba(255,255,255,0.05); padding: 0.15rem 0.5rem; border-radius: 4px; border: 1px solid var(--border-color);">
          ${t.source}
        </span>
      </td>
      <td style="font-weight: 700; color: #fff;">${formatCurrency(t.amount)}</td>
      <td>
        <span class="status-indicator ${t.status}">
          <span class="status-dot" style="background-color: currentColor; box-shadow: 0 0 6px currentColor; animation: none; width: 6px; height: 6px;"></span>
          ${t.status.charAt(0).toUpperCase() + t.status.slice(1)}
        </span>
      </td>
    `;
    tbody.appendChild(row);
  });

  initIcons();
}

// Modal Interactivity
const modalOverlay = document.getElementById('add-sale-modal');
const openModalBtn = document.getElementById('open-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const cancelModalBtn = document.getElementById('cancel-modal-btn');
const addSaleForm = document.getElementById('add-sale-form');

function toggleModal(show) {
  if (show) {
    modalOverlay.classList.add('active');
    document.getElementById('customer-name').focus();
  } else {
    modalOverlay.classList.remove('active');
    addSaleForm.reset();
  }
}

// Event Listeners Setup
function setupEventListeners() {
  // Timeframe Buttons
  const tfButtons = document.querySelectorAll('.timeframe-btn');
  tfButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      tfButtons.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      const timeframe = e.target.dataset.timeframe;
      updateKPIs(timeframe);
      updateCharts(timeframe);
    });
  });

  // Table Search and Filters
  document.getElementById('search-input').addEventListener('input', renderTable);
  document.getElementById('region-filter').addEventListener('change', renderTable);
  document.getElementById('status-filter').addEventListener('change', renderTable);

  // Modal Buttons
  openModalBtn.addEventListener('click', () => toggleModal(true));
  closeModalBtn.addEventListener('click', () => toggleModal(false));
  cancelModalBtn.addEventListener('click', () => toggleModal(false));
  
  // Close modal when clicking outside contents
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      toggleModal(false);
    }
  });

  // Form Submission
  addSaleForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const customer = document.getElementById('customer-name').value;
    const amount = parseFloat(document.getElementById('sale-amount').value);
    const region = document.getElementById('sale-region').value;
    const source = document.getElementById('sale-source').value;
    const status = document.getElementById('sale-status').value;
    
    // Create new transaction object
    const newTxn = {
      id: `TXN-${10000 + transactions.length}`,
      date: new Date(),
      customer,
      amount,
      region,
      source,
      status
    };

    // Prepend to current global list
    transactions.unshift(newTxn);
    
    // Close modal
    toggleModal(false);
    
    // Refresh components
    const activeTimeframe = document.querySelector('.timeframe-btn.active').dataset.timeframe;
    updateKPIs(activeTimeframe);
    updateCharts(activeTimeframe);
    renderTable();
    
    // Visual indicator on header status
    const statusText = document.querySelector('.status-badge span:last-child');
    statusText.innerText = "Transaction Processed!";
    statusText.style.color = "var(--emerald)";
    setTimeout(() => {
      statusText.innerText = "Live System Active";
      statusText.style.color = "var(--text-muted)";
    }, 3000);
  });
}

// App Initialization
window.addEventListener('DOMContentLoaded', () => {
  transactions = generateMockData();
  
  // Setup elements
  setupEventListeners();
  
  // Initial draw
  updateKPIs('30days');
  updateCharts('30days');
  renderTable();
  
  initIcons();
});
