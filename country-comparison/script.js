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
 * @created    13 February 2026
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
     * We create new Option objects for each country.
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