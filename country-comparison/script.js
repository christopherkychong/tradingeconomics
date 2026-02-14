/**
 * ===================================================================
 * TRADING ECONOMICS - COUNTRY COMPARISON APPLICATION
 * ===================================================================
 * 
 * FILENAME: script.js
 * PURPOSE:  Core application logic for fetching and comparing economic data
 * DEPENDS:  Trading Economics API, index.html
 * 
 * @author     Christopher Chong
 * @version    2.2
 * @created    14 February 2026
 * 
 * ===================================================================
 */

// ===================================================================
// SECTION 1: API CONFIGURATION
// ===================================================================

/**
 * Trading Economics API Key
 * -----------------------------------------
 * Required for authenticating requests to the API.
 * 
 * @constant {string}
 */
const API_KEY = "22b3b238ed6f4dc:g66j1fwewf16ldm";

/**
 * Application State
 * -----------------------------------------
 * Track whether API is currently fetching data
 * Used to prevent multiple simultaneous requests
 * 
 * @type {boolean}
 */
let isLoading = false;

// ===================================================================
// SECTION 2: DATA CONFIGURATION
// ===================================================================

/**
 * Available Countries
 * -----------------------------------------
 * List of countries accessible with the free Trading Economics API tier:
 * Sweden, Mexico, New Zealand, and Thailand
 * 
 * @constant {string[]}
 */
const COUNTRIES = [
    "sweden",        // 🇸🇪 Free tier available
    "mexico",        // 🇲🇽 Free tier available
    "new zealand",   // 🇳🇿 Free tier available
    "thailand"       // 🇹🇭 Free tier available
];

// ===================================================================
// SECTION 3: UTILITY FUNCTIONS
// ===================================================================

/**
 * Format Country Name
 * -----------------------------------------
 * Converts lowercase-with-hyphens format to Title Case
 * Example: "united states" -> "United States"
 * 
 * @param {string} countryCode - Country name in lowercase (e.g., "sweden")
 * @returns {string} Formatted country name (e.g., "Sweden")
 */
function formatCountryName(countryCode) {
    // Guard clause: return empty string if no input
    if (!countryCode) return "";
    
    // Split into words, capitalize first letter of each word
    return countryCode
        .split(' ')
        .map(word => {
            // Handle edge case: empty word
            if (word.length === 0) return word;
            // Capitalize first letter, lowercase the rest
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
}

/**
 * Format Number for Display
 * -----------------------------------------
 * Converts raw numbers into human-readable format with appropriate
 * units and decimal places:
 * - 1852720000000 → "1.85 T" (trillion)
 * - 130860000 → "130.86 M" (million)
 * - 3.79 → "3.79%" (for percentages)
 * 
 * @param {number|string} value - The value to format
 * @param {string} type - Format type: "number" or "percentage"
 * @returns {string} Formatted value
 */
function formatNumber(value, type = "number") {
    // Handle N/A values
    if (value === "N/A" || value === null || value === undefined) {
        return "N/A";
    }
    
    // If it's not a number (but also not N/A), return as is
    if (typeof value !== 'number') {
        return String(value);
    }
    
    /**
     * Percentage formatting
     * 
     * Inflation rate comes as percentage already (3.79 = 3.79%)
     * Just add % symbol
     */
    if (type === "percentage") {
        return value.toFixed(2) + '%';
    }
    
    /**
     * Number formatting with thousand separators
     * 
     * GDP values can be huge (trillions). Check if value is in
     * millions, billions, or trillions and format appropriately.
     */
    
    // Handle trillions (values over 1 trillion)
    if (value > 1_000_000_000_000) {
        return (value / 1_000_000_000_000).toFixed(2) + ' T';
    }
    
    // Handle billions (values over 1 billion)
    if (value > 1_000_000_000) {
        return (value / 1_000_000_000).toFixed(2) + ' B';
    }
    
    // Handle millions (values over 1 million)
    if (value > 1_000_000) {
        return (value / 1_000_000).toFixed(2) + ' M';
    }
    
    /**
     * Regular number formatting with thousand separators
     * and 2 decimal places
     */
    return value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// ===================================================================
// SECTION 4: UI INITIALIZATION
// ===================================================================

/**
 * Initialize Application
 * -----------------------------------------
 * Runs when the page finishes loading.
 * Populates dropdown menus with country options.
 */
window.onload = function() {
    console.log("🚀 Application initializing...");
    
    // Get references to dropdown elements
    const country1Select = document.getElementById("country1");
    const country2Select = document.getElementById("country2");
    
    // Guard clause: exit if elements don't exist
    if (!country1Select || !country2Select) {
        console.error("❌ Dropdown elements not found in DOM");
        return;
    }
    
    // Clear any existing options
    country1Select.innerHTML = '';
    country2Select.innerHTML = '';
    
    /**
     * Populate both dropdowns with country options
     */
    COUNTRIES.forEach(country => {
        // Format the display name (e.g., "sweden" -> "Sweden")
        const displayName = formatCountryName(country);
        
        // Create option for first dropdown
        const option1 = new Option(displayName, country);
        country1Select.add(option1);
        
        // Create option for second dropdown
        const option2 = new Option(displayName, country);
        country2Select.add(option2);
    });
    
    /**
     * Set intelligent default selections
     */
    country1Select.value = "mexico";
    country2Select.value = "sweden";
    
    console.log(`✅ Application initialized. Loaded ${COUNTRIES.length} countries.`);
    console.log(`📌 Default comparison: Mexico vs Sweden`);
    
    // Note about CORS proxy
    console.log(`
        🔧 CORS NOTE: This app uses All Origins proxy to bypass CORS restrictions.
        The proxy is working and should not require additional configuration.
    `);
};

// ===================================================================
// SECTION 5: API COMMUNICATION (WITH ALL ORIGINS PROXY)
// ===================================================================

/**
 * Fetch Country Economic Data
 * -----------------------------------------
 * Retrieves ALL economic indicators for a specified country
 * from the Trading Economics API using a CORS proxy.
 * 
 * API ENDPOINT:
 *   GET /country/{country}
 * 
 * WHY PROXY? Trading Economics API does not include CORS headers,
 * so browsers block direct requests. All Origins is a free proxy
 * that adds the necessary headers to allow the request.
 * 
 * @async
 * @param {string} country - Country name (lowercase)
 * @returns {Promise<Array|null>} Array of indicator objects or null if error
 */
async function fetchCountryData(country) {
    // Log start of request for debugging
    console.log(`🌐 [API] Fetching economic data for: ${country}`);
    
    /**
     * Construct the original API URL
     */
    const originalUrl = `https://api.tradingeconomics.com/country/${encodeURIComponent(country)}?c=${API_KEY}&format=json`;
    
    /**
     * CORS Proxy URL
     * -----------------------------------------
     * Using All Origins proxy (api.allorigins.win)
     * This free proxy adds CORS headers to responses, allowing
     * browser JavaScript to access APIs that don't support CORS.
     */
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(originalUrl)}`;
    
    console.log(`📡 Request URL (via proxy): ${proxyUrl}`);
    
    try {
        /**
         * Execute fetch request through the proxy
         */
        const response = await fetch(proxyUrl);
        
        // Check HTTP status
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Parse JSON response
        const data = await response.json();
        
        // Validate response data
        if (!Array.isArray(data) || data.length === 0) {
            console.warn(`⚠️ [API] No data returned for ${country}`);
            return null;
        }
        
        console.log(`✅ [API] Received ${data.length} indicators for ${country}`);
        
        // Log a sample of the data to help debugging
        if (data.length > 0) {
            console.log(`📋 Sample indicator:`, data[0]);
        }
        
        // Return the parsed data
        return data;
        
    } catch (error) {
        console.error(`❌ [API] Error fetching ${country}:`, error.message);
        
        // Special handling for common errors
        if (error.message.includes('Failed to fetch')) {
            console.warn(`
                🔧 PROXY ERROR: The All Origins proxy may be temporarily unavailable.
                Try waiting a few seconds and trying again.
            `);
        }
        
        return null;
    }
}

// ===================================================================
// SECTION 6: CORE COMPARISON LOGIC
// ===================================================================

/**
 * Compare Two Countries
 * -----------------------------------------
 * Main function called when user clicks the Compare button.
 * 
 * @async
 */
async function compareCountries() {
    console.log("🔍 [UI] Compare button clicked");
    
    // -----------------------------------------------------------------
    // Step 1: Get references to DOM elements
    // -----------------------------------------------------------------
    const country1Select = document.getElementById("country1");
    const country2Select = document.getElementById("country2");
    const resultsContainer = document.getElementById("results");
    const timestampContainer = document.getElementById("timestamp");
    
    if (!country1Select || !country2Select || !resultsContainer) {
        console.error("❌ [UI] Required DOM elements not found");
        return;
    }
    
    // -----------------------------------------------------------------
    // Step 2: Get selected values
    // -----------------------------------------------------------------
    const country1 = country1Select.value;
    const country2 = country2Select.value;
    
    console.log(`📌 [UI] Selected: ${country1} vs ${country2}`);
    
    // -----------------------------------------------------------------
    // Step 3: Validate user selection
    // -----------------------------------------------------------------
    if (!country1 || !country2) {
        alert("Please select both countries to compare.");
        return;
    }
    
    if (country1 === country2) {
        alert("Please select two different countries to compare.");
        return;
    }
    
    // -----------------------------------------------------------------
    // Step 4: Prevent multiple simultaneous requests
    // -----------------------------------------------------------------
    if (isLoading) {
        console.log("⏳ Already loading data. Please wait.");
        return;
    }
    
    isLoading = true;
    
    // -----------------------------------------------------------------
    // Step 5: Show loading state
    // -----------------------------------------------------------------
    showLoading(country1, country2);
    
    // -----------------------------------------------------------------
    // Step 6: Fetch data for both countries
    // -----------------------------------------------------------------
    try {
        const [data1, data2] = await Promise.all([
            fetchCountryData(country1),
            fetchCountryData(country2)
        ]);
        
        // -----------------------------------------------------------------
        // Step 7: Check if either fetch failed
        // -----------------------------------------------------------------
        if (!data1 || !data2) {
            console.error("❌ [API] One or both requests failed");
            showError(
                "Failed to retrieve economic data",
                "The API proxy may be rate-limited. Please wait a few seconds and try again.",
                "error"
            );
            isLoading = false;
            return;
        }
        
        if (data1.length === 0 || data2.length === 0) {
            console.warn("⚠️ [API] Empty response received");
            showError(
                "No data available",
                "The selected countries may not have the requested indicators in the free tier.",
                "warning"
            );
            isLoading = false;
            return;
        }
        
        console.log("✅ [API] Both countries fetched successfully");
        
        // -----------------------------------------------------------------
        // Step 8: Process the raw API data
        // -----------------------------------------------------------------
        const indicators = processComparisonData(data1, data2);
        
        console.log("📋 Processed indicators:", indicators);
        
        // -----------------------------------------------------------------
        // Step 9: Render the comparison table
        // -----------------------------------------------------------------
        renderTable(indicators, country1, country2);
        
        isLoading = false;
        console.log("✅ [UI] Comparison complete");
        
    } catch (error) {
        console.error("❌ [ERROR] Unexpected error:", error);
        showError(
            "Unexpected Error",
            "Something went wrong. Please try again or check the console for details.",
            "error"
        );
        isLoading = false;
    }
}

// ===================================================================
// SECTION 7: DATA PROCESSING
// ===================================================================

/**
 * Process Comparison Data
 * -----------------------------------------
 * Takes raw API response data for two countries and extracts
 * the specific indicators we need (GDP, Population, Inflation Rate)
 * 
 * IMPORTANT: The API uses "Category" field, not "Indicator" field
 * 
 * @param {Array} data1 - API response array for first country
 * @param {Array} data2 - API response array for second country
 * @returns {Array} Processed indicators ready for rendering
 */
function processComparisonData(data1, data2) {
    console.log("🔄 [DATA] Processing economic indicators...");
    
    /**
     * Helper Function: Extract Value
     * -----------------------------------------
     * Finds a specific indicator in the API response and returns its value.
     * 
     * @param {Array} data - API response array
     * @param {string} indicatorName - Name of indicator to find (e.g., "GDP")
     * @returns {number|string} The indicator value or "N/A" if not found
     */
    function extractValue(data, indicatorName) {
        // Guard clause: if data is invalid, return N/A
        if (!Array.isArray(data) || data.length === 0) {
            return "N/A";
        }
        
        // Find the object where Category matches what is being looked for
        const item = data.find(d => d && d.Category === indicatorName);
        
        if (!item) {
            console.warn(`⚠️ [DATA] Indicator "${indicatorName}" not found in response`);
            return "N/A";
        }
        
        /**
         * The API uses LatestValue field for the current value
         */
        if (item.LatestValue !== undefined && item.LatestValue !== null) {
            return item.LatestValue;
        } else if (item.LastValue !== undefined && item.LastValue !== null) {
            return item.LastValue;
        } else if (item.Value !== undefined && item.Value !== null) {
            return item.Value;
        }
        
        console.warn(`⚠️ [DATA] No value field found for ${indicatorName}`, item);
        return "N/A";
    }
    
    /**
     * Build the comparison dataset
     */
    const indicators = [
        {
            name: "GDP (USD Billion)",
            country1: extractValue(data1, "GDP"),
            country2: extractValue(data2, "GDP"),
            format: "number",
            description: "Gross Domestic Product"
        },
        {
            name: "Population (Million)",
            country1: extractValue(data1, "Population"),
            country2: extractValue(data2, "Population"),
            format: "number",
            description: "Total population"
        },
        {
            name: "Inflation Rate (%)",
            country1: extractValue(data1, "Inflation Rate"),
            country2: extractValue(data2, "Inflation Rate"),
            format: "percentage",
            description: "Annual percentage change in consumer prices"
        }
    ];
    
    console.log("✅ [DATA] Processed indicators:", indicators);
    return indicators;
}

// ===================================================================
// SECTION 8: RENDERING FUNCTIONS
// ===================================================================

/**
 * Render Comparison Table
 * -----------------------------------------
 * Takes processed indicator data and generates HTML table
 * 
 * @param {Array} indicators - Processed indicator array
 * @param {string} country1 - First country code
 * @param {string} country2 - Second country code
 */
function renderTable(indicators, country1, country2) {
    console.log("📋 [UI] Rendering comparison table...");
    
    const resultsContainer = document.getElementById("results");
    const timestampContainer = document.getElementById("timestamp");
    
    if (!resultsContainer) {
        console.error("❌ [UI] Results container not found");
        return;
    }
    
    /**
     * Calculate Difference Between Values
     */
    function calculateDifference(val1, val2) {
        if (val1 === "N/A" || val2 === "N/A" || 
            typeof val1 !== 'number' || typeof val2 !== 'number') {
            return { text: "N/A", class: "" };
        }
        
        const diff = val1 - val2;
        
        let diffText;
        if (diff > 0) {
            diffText = "+" + formatNumber(diff);
        } else if (diff < 0) {
            diffText = formatNumber(diff);
        } else {
            diffText = "0.00";
        }
        
        let diffClass = "";
        if (diff > 0) {
            diffClass = "positive-diff";
        } else if (diff < 0) {
            diffClass = "negative-diff";
        }
        
        return { text: diffText, class: diffClass };
    }
    
    /**
     * Build Table HTML
     */
    let tableHtml = `
        <h2 style="margin-top: 30px; color: #1e293b; border-bottom: 2px solid #2563eb; padding-bottom: 10px; display: flex; align-items: center; gap: 10px;">
            <span>📊</span> ${formatCountryName(country1)} vs ${formatCountryName(country2)}
        </h2>
        
        <table class="comparison-table">
            <thead>
                <tr>
                    <th>Economic Indicator</th>
                    <th>${formatCountryName(country1)}</th>
                    <th>${formatCountryName(country2)}</th>
                    <th>Difference</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    indicators.forEach(indicator => {
        const val1 = indicator.country1;
        const val2 = indicator.country2;
        
        const formatted1 = formatNumber(val1, indicator.format);
        const formatted2 = formatNumber(val2, indicator.format);
        const diff = calculateDifference(val1, val2);
        
        tableHtml += `
            <tr>
                <td>
                    <strong>${indicator.name}</strong>
                    <br>
                    <small style="color: #64748b; font-weight: normal; font-size: 0.8rem;">${indicator.description || ''}</small>
                </td>
                <td>${formatted1}</td>
                <td>${formatted2}</td>
                <td class="${diff.class}">${diff.text}</td>
            </tr>
        `;
    });
    
    tableHtml += `
            </tbody>
        </table>
    `;
    
    resultsContainer.innerHTML = tableHtml;
    
    /**
     * Update Timestamp
     */
    if (timestampContainer) {
        const now = new Date();
        const formattedDate = now.toLocaleString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
        });
        
        timestampContainer.innerHTML = `
            <span>📅 Data retrieved: ${formattedDate}</span>
            <br>
            <span>🔗 Source: Trading Economics API (via All Origins proxy)</span>
            <br>
            <span>⚡ Free tier - Sweden, Mexico, New Zealand, Thailand only</span>
        `;
    }
}

/**
 * Show Loading State
 */
function showLoading(country1, country2) {
    const resultsContainer = document.getElementById("results");
    const timestampContainer = document.getElementById("timestamp");
    
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p style="font-size: 1.2rem; margin-bottom: 8px;">Fetching economic data...</p>
            <p style="color: #64748b;">Retrieving ${formatCountryName(country1)} and ${formatCountryName(country2)}</p>
            <p style="color: #94a3b8; font-size: 0.9rem; margin-top: 15px;">
                This may take a few seconds
            </p>
        </div>
    `;
    
    if (timestampContainer) {
        timestampContainer.innerHTML = '';
    }
}

/**
 * Show Error Message
 */
function showError(title, message, type = "error") {
    const resultsContainer = document.getElementById("results");
    const timestampContainer = document.getElementById("timestamp");
    
    if (!resultsContainer) return;
    
    const borderColor = type === "error" ? "#dc2626" : "#f59e0b";
    const bgColor = type === "error" ? "#fef2f2" : "#fffbeb";
    const titleColor = type === "error" ? "#7f1d1d" : "#92400e";
    const textColor = type === "error" ? "#991b1b" : "#78350f";
    const icon = type === "error" ? "❌" : "⚠️";
    
    resultsContainer.innerHTML = `
        <div class="error-message" style="border-left-color: ${borderColor}; background-color: ${bgColor};">
            <div style="font-size: 1.5rem; margin-bottom: 10px;">${icon}</div>
            <h3 style="margin-bottom: 10px; color: ${titleColor};">${title}</h3>
            <p style="color: ${textColor};">${message}</p>
        </div>
    `;
    
    if (timestampContainer) {
        timestampContainer.innerHTML = '';
    }
}