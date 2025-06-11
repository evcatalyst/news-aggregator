/**
 * Tabulator initialization helper
 * Ensures Luxon is properly loaded for Tabulator date formatting
 */

// This will run after both Luxon and Tabulator are loaded
document.addEventListener('DOMContentLoaded', function() {
  // Check if we have Luxon available
  if (!window.luxon) {
    console.error('[tabulator-init] Luxon not found in window object, date formatting may fail');
  } else {
    console.debug('[tabulator-init] Luxon found in window object:', window.luxon);
  }

  // Check if Tabulator is loaded correctly
  if (!window.Tabulator) {
    console.error('[tabulator-init] Tabulator not found in window object');
  } else {
    console.debug('[tabulator-init] Tabulator version:', window.Tabulator.version);
    
    // Explicitly set Luxon as the datetime formatter for Tabulator
    if (window.luxon && window.luxon.DateTime) {
      console.debug('[tabulator-init] Setting up Luxon for Tabulator datetime formatting');
    }
  }
});

// Import our date formatting utilities 
import { formatTabulatorDate } from './utils/dateUtils';

// Add a custom datetime formatter for Tabulator that uses Luxon
if (window.Tabulator) {
  // Create a custom formatter that explicitly uses Luxon
  Tabulator.prototype.extendModule("format", "formatters", {
    "luxonDatetime": function(cell, formatterParams) {
      // Use our utility function for robust date handling
      return formatTabulatorDate(cell.getValue(), formatterParams);
    }
  });
  
  // Also keep the original implementation as a fallback
  Tabulator.prototype.extendModule("format", "formatters", {
    "luxonDatetimeLegacy": function(cell, formatterParams){
      if (!window.luxon || !window.luxon.DateTime) {
        console.error("Luxon DateTime not found!");
        return cell.getValue() || "";
      }
      
      let value = cell.getValue();
      let dt;
      
      if (!value) {
        return formatterParams.invalidPlaceholder || "";
      }
      
      // Try to parse the date
      try {
        if (formatterParams.inputFormat === "iso") {
          dt = window.luxon.DateTime.fromISO(value);
        } else if (formatterParams.inputFormat === "sql") {
          dt = window.luxon.DateTime.fromSQL(value);
        } else {
          dt = window.luxon.DateTime.fromFormat(value, formatterParams.inputFormat || "yyyy-MM-dd");
        }
        
        if (dt.isValid) {
          return dt.toFormat(formatterParams.outputFormat || "yyyy-MM-dd");
        } else {
          return formatterParams.invalidPlaceholder || value;
        }
      } catch (e) {
        console.error("Date parsing error:", e);
        return formatterParams.invalidPlaceholder || value;
      }
    }
  });
  
  console.debug("✓ Added Luxon-based datetime formatter to Tabulator");
}

export default { initialized: true };
