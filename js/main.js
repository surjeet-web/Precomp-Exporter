// js/main.js

(function () {
    'use strict';

    // Safety check for CSInterface
    if (typeof CSInterface === 'undefined') {
        alert('CSInterface not loaded. Please ensure the plugin is running in After Effects.');
        return;
    }
    var csInterface = new CSInterface();
    
    var appContainer = document.getElementById('app');
    var browseBtn = document.getElementById('browse-btn');
    var addBtn = document.getElementById('add-comp-btn');
    var pathDisplay = document.getElementById('library-path-display');
    var stashGrid = document.getElementById('stash-grid');
    var searchInput = document.getElementById('search-input');
    var categoryFiltersContainer = document.getElementById('category-filters');
    var loadingSpinner = document.getElementById('loading-spinner');
    var deleteModal = document.getElementById('delete-confirm-modal');
    var compToDeleteName = document.getElementById('comp-to-delete-name');
    var confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    var cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    var addCompModal = document.getElementById('add-comp-modal');
    var existingCategorySelect = document.getElementById('existing-category-select');
    var newCategoryInput = document.getElementById('new-category-input');
    var confirmAddBtn = document.getElementById('confirm-add-btn');
    var cancelAddBtn = document.getElementById('cancel-add-btn');
    var renameModal = document.getElementById('rename-comp-modal');
    var compToRenameCurrentName = document.getElementById('comp-to-rename-current-name');
    var newNameInput = document.getElementById('new-name-input');
    var confirmRenameBtn = document.getElementById('confirm-rename-btn');
    var cancelRenameBtn = document.getElementById('cancel-rename-btn');
    var creditBtn = document.getElementById('credit-button');
    var toastElement = document.getElementById('toast-notification');

    var toastTimeout;
    var allComps = [];
    var activeCategory = 'All';
    var currentDeleteInfo = null;
    var currentRenameInfo = null;

    // Security: Input validation and sanitization functions
    function sanitizeText(text) {
        if (!text) return '';
        return String(text).replace(/[<>&"']/g, function(match) {
            switch(match) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '"': return '&quot;';
                case "'": return '&#x27;';
                default: return match;
            }
        });
    }

    function validateCategoryName(name) {
        if (!name || typeof name !== 'string') return false;
        if (name.length > 50) return false;
        if (/[<>:"|?*\\\/]/.test(name)) return false;
        return true;
    }

    function sanitizePath(path) {
        if (!path) return '';
        return String(path).replace(/[<>:"|?*]/g, '').replace(/\.\./g, '');
    }

    function showToast(message, isError) {
        if (toastTimeout) clearTimeout(toastTimeout);
        
        // Security: Sanitize message and limit length
        var sanitizedMessage = sanitizeText(String(message || ''));
        sanitizedMessage = sanitizedMessage.replace(/^(Success!|Success:|Error:)\s*/, '');
        if (sanitizedMessage.length > 200) {
            sanitizedMessage = sanitizedMessage.substring(0, 200) + '...';
        }
        
        toastElement.textContent = sanitizedMessage; // Safe text assignment
        toastElement.className = 'show';
        if (isError) {
            toastElement.classList.add('error');
        } else {
            toastElement.classList.add('success');
        }
        toastTimeout = setTimeout(function () {
            toastElement.classList.remove('show');
        }, 4000);
    }

    function init() {
        creditBtn.addEventListener('click', function (e) {
            e.preventDefault();
            csInterface.openURLInDefaultBrowser('https://www.instagram.com/kuldeep.mp4/');
        });
        
        // Initialize app logic directly
        initializeAppLogic();
    }



    function showSpinner() { loadingSpinner.style.display = 'block'; }
    function hideSpinner() { loadingSpinner.style.display = 'none'; }

    function initializeAppLogic() {
        var savedPath = window.localStorage.getItem('ae_asset_stash_path');
        if (savedPath) {
            pathDisplay.textContent = savedPath;
            pathDisplay.title = savedPath;
            loadLibrary(savedPath);
        }
        browseBtn.addEventListener('click', selectLibraryFolder);
        addBtn.addEventListener('click', addSelectedComp);
        searchInput.addEventListener('input', renderCompsGrid);
        categoryFiltersContainer.addEventListener('click', handleCategoryClick);
        stashGrid.addEventListener('click', handleStashGridClick);
        cancelDeleteBtn.addEventListener('click', function () { deleteModal.style.display = 'none'; });
        confirmDeleteBtn.addEventListener('click', executeDelete);
        cancelAddBtn.addEventListener('click', function () { addCompModal.style.display = 'none'; });
        confirmAddBtn.addEventListener('click', executeAddComp);
        cancelRenameBtn.addEventListener('click', function () { renameModal.style.display = 'none'; currentRenameInfo = null; });
        confirmRenameBtn.addEventListener('click', executeRename);
        hideSpinner();
    }

    function loadLibrary(path) {
        showSpinner();
        
        // Security: Sanitize path and use JSON.stringify
        var sanitizedPath = sanitizePath(path);
        if (!sanitizedPath) {
            showToast('Invalid library path.', true);
            hideSpinner();
            return;
        }
        
        var scriptCall = 'getStashedComps(' + JSON.stringify(sanitizedPath) + ')';
        csInterface.evalScript(scriptCall, function (result) {
            try {
                var comps = (result && result !== '[]') ? JSON.parse(result) : [];
                
                // Security: Validate and sanitize comp data
                allComps = comps.filter(function(comp) {
                    return comp && comp.name && comp.category && comp.uniqueId;
                }).map(function(comp) {
                    return {
                        name: sanitizeText(comp.name),
                        category: sanitizeText(comp.category),
                        uniqueId: sanitizeText(comp.uniqueId),
                        aepPath: sanitizePath(comp.aepPath || ''),
                        thumbPath: sanitizePath(comp.thumbPath || '')
                    };
                }).sort(function (a, b) { 
                    return a.name.localeCompare(b.name); 
                });
                
                renderUI();
            } catch (e) {
                // Handle parsing error silently
                allComps = [];
                showPlaceholder("Error loading library. Please check your library folder.");
            } finally {
                hideSpinner();
            }
        });
    }

    function renderUI() { renderCategories(); renderCompsGrid(); }
    
    function renderCategories() { 
        var categories = ['All'].concat(Array.from(new Set(allComps.map(function(comp) { 
            return comp.category; 
        }))));
        
        // Security: Use DOM methods instead of innerHTML to prevent XSS
        categoryFiltersContainer.innerHTML = ''; // Clear existing content
        
        categories.forEach(function(cat) {
            if (!validateCategoryName(cat) && cat !== 'All') return; // Skip invalid categories
            
            var btn = document.createElement('button');
            btn.className = 'category-btn' + (cat === activeCategory ? ' active' : '');
            btn.setAttribute('data-category', sanitizeText(cat));
            btn.textContent = cat; // Safe text assignment
            categoryFiltersContainer.appendChild(btn);
        });
    }
    function renderCompsGrid() {
        var searchTerm = searchInput.value.toLowerCase();
        var filteredComps = allComps.filter(function (comp) { 
            return (activeCategory === 'All' || comp.category === activeCategory) && 
                   comp.name && comp.name.toLowerCase().includes(searchTerm); 
        });
        
        if (filteredComps.length === 0) {
            if (allComps.length === 0 && !window.localStorage.getItem('ae_asset_stash_path')) {
                showPlaceholder("Select a library folder to begin.");
            } else {
                showPlaceholder("No comps found. Try a different search or category.");
            }
            return;
        }
        
        // Security: Use DOM methods instead of innerHTML to prevent XSS
        stashGrid.innerHTML = ''; // Clear existing content
        
        filteredComps.forEach(function (comp) {
            // Security: Validate and sanitize all comp data
            if (!comp.uniqueId || !comp.name || !comp.category) return;
            
            var stashItem = document.createElement('div');
            stashItem.className = 'stash-item';
            stashItem.setAttribute('data-unique-id', sanitizeText(comp.uniqueId));
            stashItem.setAttribute('data-category', sanitizeText(comp.category));
            stashItem.setAttribute('data-aep-path', sanitizePath(comp.aepPath || ''));
            stashItem.setAttribute('data-name', sanitizeText(comp.name));
            
            // Create item actions
            var itemActions = document.createElement('div');
            itemActions.className = 'item-actions';
            
            var renameBtn = document.createElement('button');
            renameBtn.className = 'action-btn rename-btn';
            renameBtn.title = 'Rename';
            renameBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>';
            
            var deleteBtn = document.createElement('button');
            deleteBtn.className = 'action-btn delete-btn';
            deleteBtn.title = 'Delete';
            deleteBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
            
            itemActions.appendChild(renameBtn);
            itemActions.appendChild(deleteBtn);
            
            // Create thumbnail
            var thumbnail = document.createElement('div');
            thumbnail.className = 'thumbnail';
            
            if (comp.thumbPath) {
                var img = document.createElement('img');
                var sanitizedThumbPath = sanitizePath(comp.thumbPath);
                img.src = 'file:///' + sanitizedThumbPath.replace(/\\/g, '/');
                img.alt = 'Thumbnail';
                img.onerror = function() {
                    this.style.display = 'none';
                    var noPreview = document.createElement('div');
                    noPreview.style.cssText = 'color:var(--text-medium); font-size:12px; display:flex; align-items:center; justify-content:center; height:100%;';
                    noPreview.textContent = 'No Preview';
                    thumbnail.appendChild(noPreview);
                };
                thumbnail.appendChild(img);
            }
            
            // Create item info
            var itemInfo = document.createElement('div');
            itemInfo.className = 'item-info';
            
            var itemName = document.createElement('p');
            itemName.className = 'item-name';
            itemName.title = comp.name;
            itemName.textContent = comp.name; // Safe text assignment
            
            var importBtn = document.createElement('button');
            importBtn.className = 'import-btn';
            importBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg><span>Import</span>';
            
            itemInfo.appendChild(itemName);
            itemInfo.appendChild(importBtn);
            
            // Assemble the stash item
            stashItem.appendChild(itemActions);
            stashItem.appendChild(thumbnail);
            stashItem.appendChild(itemInfo);
            
            stashGrid.appendChild(stashItem);
        });
    }
    function showPlaceholder(message) { 
        // Security: Use DOM methods instead of innerHTML
        stashGrid.innerHTML = ''; // Clear existing content
        var placeholder = document.createElement('p');
        placeholder.className = 'placeholder-text';
        placeholder.textContent = sanitizeText(message); // Safe text assignment
        stashGrid.appendChild(placeholder);
    }
    function handleCategoryClick(e) { if (e.target.classList.contains('category-btn')) { activeCategory = e.target.dataset.category; renderUI(); } }
    function handleStashGridClick(e) { var item = e.target.closest('.stash-item'); if (!item) return; var uniqueId = item.dataset.uniqueId, category = item.dataset.category, aepPath = item.dataset.aepPath, name = item.dataset.name; if (e.target.closest('.import-btn')) { importComp(aepPath); } else if (e.target.closest('.rename-btn')) { renameComp(uniqueId, category, name); } else if (e.target.closest('.delete-btn')) { promptDelete(uniqueId, category, name); } }
    function selectLibraryFolder() { 
        showSpinner(); 
        csInterface.evalScript('selectLibraryFolder()', function (path) { 
            hideSpinner(); 
            if (path && path !== "" && path !== "null" && !path.startsWith("Error:")) { 
                // Security: Sanitize path before storing and displaying
                var sanitizedPath = sanitizePath(path);
                window.localStorage.setItem('ae_asset_stash_path', sanitizedPath); 
                pathDisplay.textContent = sanitizedPath; 
                pathDisplay.title = sanitizedPath; 
                activeCategory = 'All'; 
                searchInput.value = ''; 
                loadLibrary(sanitizedPath); 
            } else if (path && path.startsWith("Error:")) {
                showToast(path, true);
            }
        }); 
    }
    function addSelectedComp() { 
        var libraryPath = window.localStorage.getItem('ae_asset_stash_path'); 
        if (!libraryPath) { 
            showToast('Please select a library folder first.', true); 
            return; 
        } 
        
        var categories = Array.from(new Set(allComps.map(function(c) { 
            return c.category; 
        }))).sort();
        
        // Security: Use DOM methods instead of innerHTML to prevent XSS
        existingCategorySelect.innerHTML = ''; // Clear existing options
        
        categories.forEach(function(cat) {
            if (!validateCategoryName(cat)) return; // Skip invalid categories
            
            var option = document.createElement('option');
            option.value = sanitizeText(cat);
            option.textContent = cat; // Safe text assignment
            existingCategorySelect.appendChild(option);
        });
        
        existingCategorySelect.disabled = categories.length === 0; 
        
        if (categories.length === 0) { 
            var option = document.createElement('option');
            option.value = '';
            option.textContent = 'No categories yet';
            existingCategorySelect.appendChild(option);
        } 
        
        newCategoryInput.value = ''; 
        addCompModal.style.display = 'flex'; 
    }
    function executeAddComp() {
        var libraryPath = window.localStorage.getItem('ae_asset_stash_path');
        var newCatName = newCategoryInput.value.trim();
        var existingCatName = existingCategorySelect.value;
        var categoryName = newCatName || existingCatName;
        
        // Security: Validate category name
        if (!categoryName || !validateCategoryName(categoryName)) { 
            showToast('Please enter a valid category name (max 50 characters, no special characters).', true); 
            return; 
        }
        
        // Security: Sanitize inputs
        var sanitizedLibraryPath = sanitizePath(libraryPath);
        var sanitizedCategoryName = sanitizeText(categoryName);
        
        addCompModal.style.display = 'none';
        addBtn.disabled = true;
        addBtn.querySelector('span').textContent = 'Adding...';
        showSpinner();
        
        // Security: Use JSON.stringify to properly escape parameters
        var scriptCall = 'stashSelectedComp(' + JSON.stringify(sanitizedLibraryPath) + ', ' + JSON.stringify(sanitizedCategoryName) + ')';
        csInterface.evalScript(scriptCall, function (result) {
            showToast(result, result && result.startsWith('Error'));
            loadLibrary(sanitizedLibraryPath);
            addBtn.disabled = false;
            addBtn.querySelector('span').textContent = 'Add Selected Comp';
        });
    }
    function importComp(path) { 
        // Security: Sanitize and validate path
        var sanitizedPath = sanitizePath(path);
        if (!sanitizedPath) {
            showToast('Invalid file path.', true);
            return;
        }
        
        // Security: Use JSON.stringify to properly escape parameters
        var scriptCall = 'importComp(' + JSON.stringify(sanitizedPath) + ')';
        csInterface.evalScript(scriptCall, function (result) { 
            showToast(result, result && result.startsWith('Error')); 
        }); 
    }
    function renameComp(uniqueId, category, currentName) { 
        // Security: Sanitize inputs
        currentRenameInfo = { 
            uniqueId: sanitizeText(uniqueId), 
            category: sanitizeText(category), 
            oldName: sanitizeText(currentName) 
        }; 
        compToRenameCurrentName.textContent = currentName; 
        newNameInput.value = currentName; 
        renameModal.style.display = 'flex'; 
        newNameInput.focus(); 
        newNameInput.select(); 
    }
    function executeRename() {
        if (!currentRenameInfo) return;
        var newName = newNameInput.value.trim();
        var uniqueId = currentRenameInfo.uniqueId;
        var category = currentRenameInfo.category;
        var oldName = currentRenameInfo.oldName;
        
        // Security: Validate new name
        if (!newName || newName === oldName) { 
            renameModal.style.display = 'none'; 
            currentRenameInfo = null; 
            return; 
        }
        
        if (newName.length > 100 || /[<>:"|?*\\\/]/.test(newName)) {
            showToast('Invalid name. Please use only safe characters and keep under 100 characters.', true);
            return;
        }
        
        renameModal.style.display = 'none';
        showSpinner();
        var libraryPath = window.localStorage.getItem('ae_asset_stash_path');
        
        // Security: Sanitize all inputs and use JSON.stringify
        var sanitizedLibraryPath = sanitizePath(libraryPath);
        var sanitizedCategory = sanitizeText(category);
        var sanitizedUniqueId = sanitizeText(uniqueId);
        var sanitizedNewName = sanitizeText(newName);
        
        var scriptCall = 'renameStashedComp(' + 
            JSON.stringify(sanitizedLibraryPath) + ', ' + 
            JSON.stringify(sanitizedCategory) + ', ' + 
            JSON.stringify(sanitizedUniqueId) + ', ' + 
            JSON.stringify(sanitizedNewName) + ')';
            
        csInterface.evalScript(scriptCall, function (result) {
            if (result === "Success") {
                showToast("Comp renamed successfully.", false);
                loadLibrary(sanitizedLibraryPath);
            } else {
                showToast(result, true);
                hideSpinner();
            }
            currentRenameInfo = null;
        });
    }
    function promptDelete(uniqueId, category, name) { 
        // Security: Sanitize inputs
        currentDeleteInfo = { 
            uniqueId: sanitizeText(uniqueId), 
            category: sanitizeText(category) 
        }; 
        compToDeleteName.textContent = sanitizeText(name); 
        deleteModal.style.display = 'flex'; 
    }
    function executeDelete() {
        if (!currentDeleteInfo) return;
        deleteModal.style.display = 'none';
        showSpinner();
        var libraryPath = window.localStorage.getItem('ae_asset_stash_path');
        var uniqueId = currentDeleteInfo.uniqueId;
        var category = currentDeleteInfo.category;
        
        // Security: Sanitize all inputs and use JSON.stringify
        var sanitizedLibraryPath = sanitizePath(libraryPath);
        var sanitizedCategory = sanitizeText(category);
        var sanitizedUniqueId = sanitizeText(uniqueId);
        
        var scriptCall = 'deleteStashedComp(' + 
            JSON.stringify(sanitizedLibraryPath) + ', ' + 
            JSON.stringify(sanitizedCategory) + ', ' + 
            JSON.stringify(sanitizedUniqueId) + ')';
            
        csInterface.evalScript(scriptCall, function (result) {
            if (result === "Success") {
                showToast("Comp deleted successfully.", false);
                loadLibrary(sanitizedLibraryPath);
            } else {
                showToast(result, true);
                hideSpinner();
            }
            currentDeleteInfo = null;
        });
    }

    // Initialize the application directly
    init();
}());