// Performance monitoring and optimization utilities
(function() {
    'use strict';
    
    // Performance monitoring
    var performanceMetrics = {
        renderTimes: [],
        searchTimes: [],
        loadTimes: []
    };
    
    // Debounce utility
    function debounce(func, wait, immediate) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }
    
    // Throttle utility
    function throttle(func, limit) {
        var inThrottle;
        return function() {
            var args = arguments;
            var context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(function() { inThrottle = false; }, limit);
            }
        };
    }
    
    // Virtual scrolling for large lists (if needed)
    function createVirtualScroller(container, items, itemHeight, renderItem) {
        var scrollTop = 0;
        var containerHeight = container.clientHeight;
        var totalHeight = items.length * itemHeight;
        var visibleStart = Math.floor(scrollTop / itemHeight);
        var visibleEnd = Math.min(visibleStart + Math.ceil(containerHeight / itemHeight) + 1, items.length);
        
        // Create virtual container
        var virtualContainer = document.createElement('div');
        virtualContainer.style.height = totalHeight + 'px';
        virtualContainer.style.position = 'relative';
        
        // Render visible items
        for (var i = visibleStart; i < visibleEnd; i++) {
            var item = renderItem(items[i], i);
            item.style.position = 'absolute';
            item.style.top = (i * itemHeight) + 'px';
            virtualContainer.appendChild(item);
        }
        
        return virtualContainer;
    }
    
    // Image lazy loading with Intersection Observer
    function setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            var imageObserver = new IntersectionObserver(function(entries, observer) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        var img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });
            
            // Observe all lazy images
            document.querySelectorAll('img[data-src]').forEach(function(img) {
                imageObserver.observe(img);
            });
        }
    }
    
    // Memory management
    function cleanupUnusedElements() {
        // Remove elements that are far from viewport
        var items = document.querySelectorAll('.stash-item');
        var viewportHeight = window.innerHeight;
        
        items.forEach(function(item) {
            var rect = item.getBoundingClientRect();
            if (rect.bottom < -viewportHeight || rect.top > viewportHeight * 2) {
                // Element is far from viewport, can be cleaned up
                var images = item.querySelectorAll('img');
                images.forEach(function(img) {
                    img.src = ''; // Free memory
                });
            }
        });
    }
    
    // Performance measurement
    function measurePerformance(name, fn) {
        var start = performance.now();
        var result = fn();
        var end = performance.now();
        var duration = end - start;
        
        if (performanceMetrics[name + 'Times']) {
            performanceMetrics[name + 'Times'].push(duration);
            // Keep only last 100 measurements
            if (performanceMetrics[name + 'Times'].length > 100) {
                performanceMetrics[name + 'Times'].shift();
            }
        }
        
        return result;
    }
    
    // Export utilities to global scope
    window.CompBuddyPerf = {
        debounce: debounce,
        throttle: throttle,
        measurePerformance: measurePerformance,
        setupLazyLoading: setupLazyLoading,
        cleanupUnusedElements: cleanupUnusedElements,
        getMetrics: function() { return performanceMetrics; }
    };
    
    // Auto-cleanup on scroll (throttled)
    if (typeof window !== 'undefined') {
        window.addEventListener('scroll', throttle(cleanupUnusedElements, 1000), { passive: true });
    }
    
})();