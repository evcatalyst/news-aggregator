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

// Define formatTabulatorDate directly instead of importing to avoid module issues
function formatTabulatorDate(dateStr, format = {}) {
  if (!dateStr) return format.invalidPlaceholder || "";
  
  try {
    if (!window.luxon && !window.DateTime) {
      console.error("Luxon not available");
      return dateStr;
    }
    
    const luxonDateTime = window.luxon ? window.luxon.DateTime : window.DateTime;
    let dt;
    
    if (format.inputFormat === "iso") {
      dt = luxonDateTime.fromISO(dateStr);
    } else if (format.inputFormat === "sql") {
      dt = luxonDateTime.fromSQL(dateStr);
    } else {
      dt = luxonDateTime.fromFormat(dateStr, format.inputFormat || "yyyy-MM-dd");
    }
    
    if (dt.isValid) {
      return dt.toFormat(format.outputFormat || "yyyy-MM-dd");
    }
    
    return format.invalidPlaceholder || dateStr;
  } catch (e) {
    console.error("Date formatting error:", e);
    return format.invalidPlaceholder || dateStr;
  }
}

// Add formatters safely to Tabulator if it exists
document.addEventListener('DOMContentLoaded', function() {
  if (window.Tabulator) {
    try {
      console.log("Adding formatters to Tabulator");
      // Simple direct assignment of formatter function
      Tabulator.prototype.formatters.luxonDatetime = function(cell, formatterParams) {
        return formatTabulatorDate(cell.getValue(), formatterParams);
      };
    } catch (e) {
      console.error("Error setting up Tabulator formatters:", e);
    }
  }
});
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
