// Track active observers to prevent multiple observers on the same element
const activeObservers = new WeakMap();

export function updateHeight(window, document, obj, setChange=null, fixHeight=null){
    let frame = window.frameElement;
    let height = document.getElementById(`${obj.divid}`).scrollHeight ;
    height =  height + 100;
    if(fixHeight){
        height = fixHeight;
    }
    frame.style.height = height+'px'

    if(setChange){
        document.body.addEventListener('click', function( event ){
            setTimeout(() => {updateHeight(window, document, obj)}, 20)
    });
    }
}

/**
 * Set up automatic height updates using MutationObserver
 * This function creates a MutationObserver that watches for DOM changes
 * and automatically calls updateHeight when content changes occur.
 * 
 * @param {Window} window - The window object
 * @param {Document} document - The document object  
 * @param {Object} obj - The component object with divid property
 * @param {Object} options - Configuration options
 * @param {number} options.debounceDelay - Delay in ms for debouncing updates (default: 20)
 * @param {Array} options.watchAttributes - Attributes to watch for changes (default: ['style', 'class'])
 * @param {Function} options.shouldUpdate - Custom function to determine if update is needed
 */
export function setupAutoHeightUpdate(window, document, obj, options = {}) {
    const {
        debounceDelay = 20,
        watchAttributes = ['style', 'class'],
        shouldUpdate = null
    } = options;

    const containerElement = document.getElementById(obj.divid);
    if (!containerElement) {
        console.warn(`Cannot setup auto height update: element with id ${obj.divid} not found`);
        return null;
    }

    // Check if observer already exists for this element
    if (activeObservers.has(containerElement)) {
        console.log(`Auto height update already active for ${obj.divid}`);
        return activeObservers.get(containerElement);
    }

    // Debounce function to prevent excessive height updates
    let heightUpdateTimeout;
    const debouncedHeightUpdate = () => {
        clearTimeout(heightUpdateTimeout);
        heightUpdateTimeout = setTimeout(() => {
            updateHeight(window, document, obj);
        }, debounceDelay);
    };

    // Create MutationObserver to watch for DOM changes
    const observer = new MutationObserver((mutations) => {
        let shouldUpdateHeight = false;
        
        mutations.forEach((mutation) => {
            // Custom shouldUpdate function takes precedence
            if (shouldUpdate && typeof shouldUpdate === 'function') {
                if (shouldUpdate(mutation, containerElement)) {
                    shouldUpdateHeight = true;
                }
                return;
            }

            // Default logic: check if the mutation affects visible content
            const target = mutation.target;
            
            // Check for changes within our container
            if (target === containerElement || containerElement.contains(target)) {
                // Handle different types of mutations
                switch (mutation.type) {
                    case 'childList':
                        // Content was added or removed
                        if (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) {
                            shouldUpdateHeight = true;
                        }
                        break;
                    
                    case 'attributes':
                        // Style or class changes that might affect height
                        if (mutation.attributeName === 'style') {
                            const element = mutation.target;
                            const computedStyle = window.getComputedStyle(element);
                            const affectsHeight = ['display', 'visibility', 'height', 'min-height', 'max-height', 'padding', 'margin', 'border'].some(prop => 
                                element.style[prop] || computedStyle[prop]
                            );
                            if (affectsHeight) {
                                shouldUpdateHeight = true;
                            }
                        } else if (mutation.attributeName === 'class') {
                            // Class changes might affect visibility/height
                            shouldUpdateHeight = true;
                        }
                        break;
                }
            }
        });
        
        if (shouldUpdateHeight) {
            debouncedHeightUpdate();
        }
    });

    // Start observing with comprehensive options
    observer.observe(containerElement, {
        childList: true,        // Watch for added/removed elements
        subtree: true,         // Watch all descendants
        attributes: true,      // Watch attribute changes
        attributeFilter: watchAttributes, // Only watch specific attributes
        characterData: true    // Watch text content changes
    });

    // Store the observer for cleanup
    activeObservers.set(containerElement, observer);
    
    console.log(`Auto height update activated for ${obj.divid}`);
    return observer;
}

/**
 * Disconnect the automatic height updates for a component
 * @param {Object} obj - The component object with divid property
 * @param {Document} document - The document object
 */
export function disconnectAutoHeightUpdate(obj, document) {
    const containerElement = document.getElementById(obj.divid);
    if (!containerElement) return;

    const observer = activeObservers.get(containerElement);
    if (observer) {
        observer.disconnect();
        activeObservers.delete(containerElement);
        console.log(`Auto height update disconnected for ${obj.divid}`);
    }
}

/**
 * Enhanced updateHeight that automatically sets up MutationObserver monitoring
 * This is a convenience function that combines updateHeight with setupAutoHeightUpdate
 * 
 * @param {Window} window - The window object
 * @param {Document} document - The document object
 * @param {Object} obj - The component object with divid property
 * @param {boolean} enableAutoUpdate - Whether to enable automatic height updates (default: false)
 * @param {Object} autoUpdateOptions - Options for automatic updates
 */
export function updateHeightWithAutoMonitoring(window, document, obj, enableAutoUpdate = false, autoUpdateOptions = {}) {
    // Perform initial height update
    updateHeight(window, document, obj);
    
    // Set up automatic monitoring if requested
    if (enableAutoUpdate) {
        return setupAutoHeightUpdate(window, document, obj, autoUpdateOptions);
    }
    
    return null;
}