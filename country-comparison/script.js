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
 * @version    1.0
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
 * List of countries accessible with the free Trading Economics API tier.
 * 
 * SELECTION CRITERIA:
 * 1. Major economies (G7, BRICS)
 * 2. Regional representation
 * 3. Confirmed data availability on free tier
 * 
 * Why these 15? Testing showed these consistently return GDP,
 * Population, and Inflation Rate data.
 * 
 * @constant {string[]}
 */
const COUNTRIES = [
    "united states",     // North America, largest economy
    "china",            // Asia, second largest economy
    "japan",            // Asia, G7
    "germany",          // Europe, largest EU economy
    "united kingdom",   // Europe, G7
    "france",           // Europe, G7
    "india",            // Asia, BRICS, fastest growing
    "brazil",           // South America, BRICS
    "canada",           // North America, G7
    "australia",        // Oceania, major commodity economy
    "nigeria",          // Africa, largest African economy
    "south africa",     // Africa, BRICS
    "mexico",           // North America, emerging market
    "russia",           // Europe/Asia, BRICS
    "south korea"       // Asia, advanced economy
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
 * This improves readability in the UI while maintaining
 * correct format for API requests (which requires lowercase).
 * 
 * @param {string} countryCode - Country name in lowercase (e.g., "united states")
 * @returns {string} Formatted country name (e.g., "United States")
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

// ===================================================================
// SECTION 4: UI INITIALIZATION
// ===================================================================

/**
 * Initialize Application
 * -----------------------------------------
 * Runs when the page finishes loading.
 * Populates dropdown menus with country options.
 * 
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
    
    // Clear any existing options (keeps dropdown clean)
    country1Select.innerHTML = '';
    country2Select.innerHTML = '';
    
    /**
     * Populate both dropdowns with country options
     * 
     * Create new Option objects for each country.
     */
    COUNTRIES.forEach(country => {
        // Format the display name (e.g., "united states" -> "United States")
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
     * 
     * United States and China are the world's two largest economies.
     * This gives users a meaningful comparison immediately.
     */
    country1Select.value = "united states";
    country2Select.value = "china";
    
    console.log(`✅ Application initialized. Loaded ${COUNTRIES.length} countries.`);
    console.log(`📌 Default comparison: United States vs China`);
};

// ===================================================================
// SECTION 5: API COMMUNICATION
// ===================================================================

/**
 * Fetch Country Economic Data
 * -----------------------------------------
 * Retrieves GDP, Population, and Inflation Rate for a specified country
 * from the Trading Economics API.
 * 
 * API ENDPOINT:
 *   GET /country/{country}/indicator/gdp,population,inflationrate
 * 
 * PARAMETERS:
 *   - country: Country name in lowercase (e.g., "united states")
 *   - c: API key (automatically appended)
 *   - format: json (response format)
 * 
 * RESPONSE FORMAT:
 *   Array of objects, each containing:
 *   - Indicator: string (e.g., "GDP")
 *   - LatestValue: number
 *   - LastValue: number (fallback)
 *   - Unit: string
 *   - Country: string
 * 
 * @async
 * @param {string} country - Country name (lowercase, hyphenated if needed)
 * @returns {Promise<Array|null>} Array of indicator objects or null if error
 */
async function fetchCountryData(country) {
    // Log start of request for debugging
    console.log(`🌐 [API] Fetching economic data for: ${country}`);
    
    /**
     * Construct API URL
     * 
     * Template literal allows dynamic insertion of country and API key.
     * We request exactly three indicators to minimize response size
     * and stay within free tier rate limits.
     */
    const url = `https://api.tradingeconomics.com/country/${encodeURIComponent(country)}/indicator/gdp,population,inflationrate?c=${API_KEY}&format=json`;
    
    try {
        /**
         * Execute fetch request
         * 
         * fetch() returns a Promise that resolves to the Response object.
         * Await it to get the actual response.
         */
        const response = await fetch(url);
        
        /**
         * Check HTTP status
         * 
         * Successful responses have status 200-299.
         * fetch() doesn't reject on HTTP errors, so check manually.
         */
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        /**
         * Parse JSON response
         * 
         * response.json() also returns a Promise, so await it.
         */
        const data = await response.json();
        
        /**
         * Validate response data
         * 
         * API should return an array. If it's empty or not an array,
         * something went wrong.
         */
        if (!Array.isArray(data) || data.length === 0) {
            console.warn(`⚠️ [API] No data returned for ${country}`);
            return null;
        }
        
        // Log success with data summary
        console.log(`✅ [API] Received ${data.length} indicators for ${country}`);
        
        // Return the parsed data
        return data;
        
    } catch (error) {
        /**
         * Error Handling
         * 
         * Categories of errors we might encounter:
         * 1. Network errors (offline, DNS failure)
         * 2. CORS errors (if running from file://)
         * 3. API errors (invalid key, rate limit)
         * 4. JSON parsing errors
         * 
         * Log the full error for debugging and return null
         * so calling functions can handle gracefully.
         */
        console.error(`❌ [API] Error fetching ${country}:`, error.message);
        
        /**
         * Special case: CORS error detection
         * 
         * CORS errors occur when running from file:// protocol.
         * Provide a helpful message in the console.
         */
        if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
            console.warn(`
                🔧 CORS ERROR DETECTED:
                You're likely opening index.html directly from the filesystem.
                To fix: Run a local server:
                - Python: python -m http.server 8000
                - VS Code: Live Server extension
                - Node: npx http-server
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
 * 1. Validate user input
 * 2. Show loading state
 * 3. Fetch data for both countries
 * 4. Process the data
 * 5. Render the comparison table
 * 
 * 
 * @async
 * @function compareCountries
 * @returns {Promise<void>}
 */
async function compareCountries() {
    // Log to console for debugging - helps trace user interaction
    console.log("🔍 [UI] Compare button clicked");
    
    // -----------------------------------------------------------------
    // Step 1: Get references to DOM elements
    // -----------------------------------------------------------------
    // We need these elements to read values and update the UI
    const country1Select = document.getElementById("country1");
    const country2Select = document.getElementById("country2");
    const resultsContainer = document.getElementById("results");
    const timestampContainer = document.getElementById("timestamp");
    
    // Guard clause: exit if required DOM elements don't exist
    // This prevents errors if someone accidentally removes an element from HTML
    if (!country1Select || !country2Select || !resultsContainer) {
        console.error("❌ [UI] Required DOM elements not found");
        return;
    }
    
    // -----------------------------------------------------------------
    // Step 2: Get selected values from dropdowns
    // -----------------------------------------------------------------
    // .value property gives us the country code (e.g., "united states")
    const country1 = country1Select.value;
    const country2 = country2Select.value;
    
    // Log selected countries for debugging
    console.log(`📌 [UI] Selected: ${country1} vs ${country2}`);
    
    // -----------------------------------------------------------------
    // Step 3: Validate user selection
    // -----------------------------------------------------------------
    
    // Check if both countries are selected (not empty)
    if (!country1 || !country2) {
        // Show alert to user - this is a quick feedback mechanism
        alert("Please select both countries to compare.");
        return;
    }
    
    // Prevent comparing the same country
    if (country1 === country2) {
        alert("Please select two different countries to compare.");
        return;
    }
    
    // -----------------------------------------------------------------
    // Step 4: Prevent multiple simultaneous requests
    // -----------------------------------------------------------------
    // The isLoading flag prevents users from clicking multiple times
    // while a request is already in progress
    if (isLoading) {
        console.log("⏳ Already loading data. Please wait.");
        // Optionally show a toast or notification here
        return;
    }
    
    // Set loading flag to true - prevents additional clicks
    isLoading = true;
    
    // -----------------------------------------------------------------
    // Step 5: Show loading state in UI
    // -----------------------------------------------------------------
    // Clear any previous results and show loading spinner
    resultsContainer.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p style="font-size: 1.2rem; margin-bottom: 8px;">Fetching economic data...</p>
            <p style="color: #64748b;">Retrieving ${formatCountryName(country1)} and ${formatCountryName(country2)}</p>
            <p style="color: #94a3b8; font-size: 0.9rem; margin-top: 15px;">
                This may take a few seconds depending on API response time
            </p>
        </div>
    `;
    
    // Clear any existing timestamp
    if (timestampContainer) {
        timestampContainer.innerHTML = '';
    }
    
    // -----------------------------------------------------------------
    // Step 6: Fetch data for both countries
    // -----------------------------------------------------------------
    /**
     * Using Promise.all for parallel requests
     */
    try {
        const [data1, data2] = await Promise.all([
            fetchCountryData(country1),
            fetchCountryData(country2)
        ]);
        
        // -----------------------------------------------------------------
        // Step 7: Check if either fetch failed
        // -----------------------------------------------------------------
        // fetchCountryData returns null on error, so we check for that
        if (!data1 || !data2) {
            console.error("❌ [API] One or both requests failed");
            
            // Show user-friendly error message
            resultsContainer.innerHTML = `
                <div class="error-message">
                    <div style="font-size: 1.5rem; margin-bottom: 10px;">❌</div>
                    <h3 style="margin-bottom: 10px; color: #7f1d1d;">Failed to retrieve economic data</h3>
                    <p style="margin-bottom: 10px; color: #991b1b;">
                        The API may be rate-limited or the selected countries might not have data available.
                    </p>
                    <p style="margin-top: 15px; color: #64748b; font-size: 0.9rem;">
                        Try:
                        <br>• Waiting a few seconds and trying again
                        <br>• Selecting different countries
                        <br>• Checking your API key in script.js
                    </p>
                </div>
            `;
            
            // Reset loading flag
            isLoading = false;
            return;
        }
        
        // Check if data arrays are empty (no indicators returned)
        if (data1.length === 0 || data2.length === 0) {
            console.warn("⚠️ [API] Empty response received");
            
            resultsContainer.innerHTML = `
                <div class="error-message" style="border-left-color: #f59e0b;">
                    <div style="font-size: 1.5rem; margin-bottom: 10px;">⚠️</div>
                    <h3 style="margin-bottom: 10px; color: #92400e;">No data available</h3>
                    <p style="color: #78350f;">
                        The selected countries may not have the requested indicators in the free tier.
                    </p>
                </div>
            `;
            
            isLoading = false;
            return;
        }
        
        // Log success for debugging
        console.log("✅ [API] Both countries fetched successfully");
        console.log(`📊 ${formatCountryName(country1)}:`, data1);
        console.log(`📊 ${formatCountryName(country2)}:`, data2);
        
        // -----------------------------------------------------------------
        // Step 8: Process the raw API data
        // -----------------------------------------------------------------
        /**
         * The raw API response contains many fields we don't need.
         * processComparisonData extracts only:
         * - GDP
         * - Population
         * - Inflation Rate
         * 
         * It returns a clean, structured array ready for display
         */
        const indicators = processComparisonData(data1, data2);
        
        console.log("📋 Processed indicators ready for rendering:", indicators);
        
        // -----------------------------------------------------------------
        // Step 9: Render the comparison table
        // -----------------------------------------------------------------
        // Pass the processed data to our rendering function
        renderTable(indicators, country1, country2);
        
        // -----------------------------------------------------------------
        // Step 10: Reset loading flag
        // -----------------------------------------------------------------
        isLoading = false;
        
        console.log("✅ [UI] Comparison complete");
        
    } catch (error) {
        // -----------------------------------------------------------------
        // Step 11: Catch any unexpected errors
        // -----------------------------------------------------------------
        // This catches errors not handled in fetchCountryData
        console.error("❌ [ERROR] Unexpected error in compareCountries:", error);
        
        resultsContainer.innerHTML = `
            <div class="error-message">
                <div style="font-size: 1.5rem; margin-bottom: 10px;">❌</div>
                <h3 style="margin-bottom: 10px; color: #7f1d1d;">Unexpected Error</h3>
                <p style="color: #991b1b;">
                    Something went wrong. Please try again or check the console for details.
                </p>
            </div>
        `;
        
        // Always reset loading flag, even on error
        isLoading = false;
    }

/**
 * Show Loading State
 * -----------------------------------------
 * Displays loading spinner while waiting for API response.
 * This is a helper function that can be called from multiple places.
 * 
 * @param {string} country1 - First country name
 * @param {string} country2 - Second country name
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
                This may take a few seconds depending on API response time
            </p>
        </div>
    `;
    
    if (timestampContainer) {
        timestampContainer.innerHTML = '';
    }
}

/**
 * Show Error Message
 * -----------------------------------------
 * Displays user-friendly error messages when something goes wrong.
 * 
 * @param {string} title - Error title
 * @param {string} message - Detailed error message
 * @param {string} type - Error type: "error" (red) or "warning" (orange)
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

// ===================================================================
// SECTION 7: DATA PROCESSING
// ===================================================================

/**
 * Process Comparison Data
 * -----------------------------------------
 * Takes raw API response data for two countries and extracts
 * the specific indicators we need (GDP, Population, Inflation Rate)
 * into a structured format ready for display.
 * 
 * This function finds the relevant indicators and formats them
 * for comparison.
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
        
        // Find the object where Indicator matches what we're looking for
        const item = data.find(d => d && d.Indicator === indicatorName);
        
        if (!item) {
            console.warn(`⚠️ [DATA] Indicator "${indicatorName}" not found in response`);
            return "N/A";
        }
        
        /**
         * Different APIs use different field names for the value.
         */
        if (item.LatestValue !== undefined && item.LatestValue !== null) {
            return item.LatestValue;
        } else if (item.LastValue !== undefined && item.LastValue !== null) {
            return item.LastValue;
        } else if (item.Value !== undefined && item.Value !== null) {
            return item.Value;
        }
        
        // If no value field was found
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
            description: "Gross Domestic Product - total value of goods and services"
        },
        {
            name: "Population (Million)",
            country1: extractValue(data1, "Population"),
            country2: extractValue(data2, "Population"),
            format: "number",
            description: "Total population - may be shown in thousands or millions"
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

/**
 * Format Number for Display
 * -----------------------------------------
 * Converts raw numbers into human-readable format with appropriate
 * units and decimal places:
 * - 25462700 → "25,462.70" (GDP in billions handled separately)
 * - 3.14159 → "3.14"
 * - 0.05 → "5.00%" (for percentages)
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
     * Inflation rate comes as decimal (0.05 = 5%)
     * We multiply by 100 and add % symbol
     */
    if (type === "percentage") {
        return (value * 100).toFixed(2) + '%';
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
}}