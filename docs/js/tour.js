/**
 * SiteDelta - Driver.js Tour Configuration
 */

function initGuidedTour() {
    // Check if driver.js is loaded
    if (typeof window.driver === 'undefined') {
        console.error('Driver.js not loaded');
        return null;
    }

    const driver = window.driver.js.driver;

    const driverObj = driver({
        showProgress: true,
        progressText: '{{current}} / {{total}}',
        animate: true,
        smoothScroll: true,
        allowClose: true,
        overlayColor: '#000',
        overlayOpacity: 0.75,
        stagePadding: 10,
        stageRadius: 8,

        steps: [
            // Step 1: Introduction
            {
                element: '#demo-website',
                popover: {
                    title: 'Target Website',
                    description: 'This is a mock e-commerce page. SiteDelta can monitor any website element - prices, stock status, content changes, and more.',
                    side: 'right',
                    align: 'center'
                }
            },

            // Step 2: Price element
            {
                element: '#demo-price',
                popover: {
                    title: 'Element to Monitor',
                    description: 'We want to track this price. SiteDelta uses CSS selectors (like ".product-price") to target specific elements on a page.',
                    side: 'bottom',
                    align: 'center'
                },
                onHighlightStarted: () => {
                    document.getElementById('demo-price').classList.add('tour-highlight');
                },
                onDeselected: () => {
                    document.getElementById('demo-price').classList.remove('tour-highlight');
                }
            },

            // Step 3: Config file
            {
                element: '#patrol-config',
                popover: {
                    title: 'YAML Configuration',
                    description: 'Define what to monitor in a simple config.yaml file. Specify the URL, CSS selector, and optional regex pattern to extract values.',
                    side: 'left',
                    align: 'start'
                }
            },

            // Step 4: Selector highlight
            {
                element: '.hl-selector',
                popover: {
                    title: 'CSS Selector',
                    description: 'This selector targets the price element. Use Chrome DevTools or browser extensions like SelectorGadget to find selectors easily.',
                    side: 'left',
                    align: 'center'
                }
            },

            // Step 5: Console output
            {
                element: '#patrol-console',
                popover: {
                    title: 'GitHub Actions Execution',
                    description: 'SiteDelta runs on a schedule (e.g., every 6 hours) using GitHub Actions. No server or Docker required - just free GitHub hosting!',
                    side: 'left',
                    align: 'center'
                }
            },

            // Step 6: Demo button
            {
                element: '#start-demo-btn',
                popover: {
                    title: 'See Change Detection',
                    description: 'Click "Start Demo" to simulate a price drop and see how SiteDelta detects and reports the change.',
                    side: 'top',
                    align: 'center'
                }
            }
        ],

        // After tour completes
        onDestroyed: () => {
            // Add pulse animation to demo button
            const startBtn = document.getElementById('start-demo-btn');
            if (startBtn && !startBtn.disabled) {
                startBtn.classList.add('pulse-animation');
            }
        }
    });

    return driverObj;
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Guided Tour button
    const guidedTourBtn = document.getElementById('guided-tour-btn');
    if (guidedTourBtn) {
        guidedTourBtn.addEventListener('click', () => {
            const tour = initGuidedTour();
            if (tour) {
                tour.drive();
            }
        });
    }

    // Hero CTA "Try Interactive Demo" button
    const tryDemoBtn = document.getElementById('try-demo-btn');
    if (tryDemoBtn) {
        tryDemoBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // Scroll to demo section
            const demoSection = document.getElementById('demo');
            if (demoSection) {
                demoSection.scrollIntoView({ behavior: 'smooth' });

                // Start tour after scroll
                setTimeout(() => {
                    const tour = initGuidedTour();
                    if (tour) {
                        tour.drive();
                    }
                }, 600);
            }
        });
    }
});
