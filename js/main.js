// js/main.js

(function () {
    'use strict';

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

    function showToast(message, isError) {
        if (toastTimeout) clearTimeout(toastTimeout);
        message = message.replace(/^(Success!|Success:|Error:)\s*/, '');
        toastElement.textContent = message;
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
        csInterface.evalScript('getStashedComps("' + path.replace(/\\/g, '\\\\') + '")', function (result) {
            try {
                allComps = (result && result !== '[]') ? JSON.parse(result).sort(function (a, b) { return a.name.localeCompare(b.name); }) : [];
                renderUI();
            } catch (e) {
                console.error("Failed to parse comps data:", e);
                allComps = [];
                showPlaceholder("Error loading library. Check console for details.");
            } finally {
                hideSpinner();
            }
        });
    }

    function renderUI() { renderCategories(); renderCompsGrid(); }
    function renderCategories() { var categories = ['All'].concat(Array.from(new Set(allComps.map(function(comp) { return comp.category; })))); categoryFiltersContainer.innerHTML = categories.map(function(cat) { return '<button class="category-btn ' + (cat === activeCategory ? 'active' : '') + '" data-category="' + cat + '">' + cat + '</button>'; }).join(''); }
    function renderCompsGrid() {
        var searchTerm = searchInput.value.toLowerCase();
        var filteredComps = allComps.filter(function (comp) { return (activeCategory === 'All' || comp.category === activeCategory) && comp.name.toLowerCase().includes(searchTerm); });
        if (filteredComps.length === 0) {
            if (allComps.length === 0 && !window.localStorage.getItem('ae_asset_stash_path')) {
                showPlaceholder("Select a library folder to begin.");
            } else {
                showPlaceholder("No comps found. Try a different search or category.");
            }
            return;
        }
        stashGrid.innerHTML = filteredComps.map(function (comp) {
            var thumbSrc = comp.thumbPath ? 'file:///' + comp.thumbPath.replace(/\\/g, '/') : '';
            return `
                <div class="stash-item" data-unique-id="${comp.uniqueId}" data-category="${comp.category}" data-aep-path="${comp.aepPath}" data-name="${comp.name}">
                    <div class="item-actions">
                        <button class="action-btn rename-btn" title="Rename"><svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg></button>
                        <button class="action-btn delete-btn" title="Delete"><svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
                    </div>
                    <div class="thumbnail"><img src="${thumbSrc}" onerror="this.style.display='none'; this.parentElement.innerHTML += '<div style=\\'color:var(--text-medium); font-size:12px; display:flex; align-items:center; justify-content:center; height:100%;\\'>No Preview</div>';" alt="Thumbnail"></div>
                    <div class="item-info">
                        <p class="item-name" title="${comp.name}">${comp.name}</p>
                        <button class="import-btn"><svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg><span>Import</span></button>
                    </div>
                </div>`;
        }).join('');
    }
    function showPlaceholder(message) { stashGrid.innerHTML = '<p class="placeholder-text">' + message + '</p>'; }
    function handleCategoryClick(e) { if (e.target.classList.contains('category-btn')) { activeCategory = e.target.dataset.category; renderUI(); } }
    function handleStashGridClick(e) { var item = e.target.closest('.stash-item'); if (!item) return; var uniqueId = item.dataset.uniqueId, category = item.dataset.category, aepPath = item.dataset.aepPath, name = item.dataset.name; if (e.target.closest('.import-btn')) { importComp(aepPath); } else if (e.target.closest('.rename-btn')) { renameComp(uniqueId, category, name); } else if (e.target.closest('.delete-btn')) { promptDelete(uniqueId, category, name); } }
    function selectLibraryFolder() { showSpinner(); csInterface.evalScript('selectLibraryFolder()', function (path) { hideSpinner(); if (path) { window.localStorage.setItem('ae_asset_stash_path', path); pathDisplay.textContent = path; pathDisplay.title = path; activeCategory = 'All'; searchInput.value = ''; loadLibrary(path); } }); }
    function addSelectedComp() { var libraryPath = window.localStorage.getItem('ae_asset_stash_path'); if (!libraryPath) { showToast('Please select a library folder first.', true); return; } var categories = Array.from(new Set(allComps.map(function(c) { return c.category; }))).sort(); existingCategorySelect.innerHTML = categories.map(function (cat) { return '<option value="' + cat + '">' + cat + '</option>'; }).join(''); existingCategorySelect.disabled = categories.length === 0; if (categories.length === 0) { existingCategorySelect.innerHTML = '<option value="">No categories yet</option>'; } newCategoryInput.value = ''; addCompModal.style.display = 'flex'; }
    function executeAddComp() {
        var libraryPath = window.localStorage.getItem('ae_asset_stash_path');
        var newCatName = newCategoryInput.value.trim();
        var existingCatName = existingCategorySelect.value;
        var categoryName = newCatName || existingCatName;
        if (!categoryName) { showToast('Please select or create a category.', true); return; }
        addCompModal.style.display = 'none';
        addBtn.disabled = true;
        addBtn.querySelector('span').textContent = 'Adding...';
        showSpinner();
        csInterface.evalScript('stashSelectedComp("' + libraryPath.replace(/\\/g, '\\\\') + '", "' + categoryName + '")', function (result) {
            showToast(result, result.startsWith('Error'));
            loadLibrary(libraryPath);
            addBtn.disabled = false;
            addBtn.querySelector('span').textContent = 'Add Selected Comp';
        });
    }
    function importComp(path) { csInterface.evalScript('importComp("' + path.replace(/\\/g, '\\\\') + '")', function (result) { showToast(result, result.startsWith('Error')); }); }
    function renameComp(uniqueId, category, currentName) { currentRenameInfo = { uniqueId: uniqueId, category: category, oldName: currentName }; compToRenameCurrentName.textContent = currentName; newNameInput.value = currentName; renameModal.style.display = 'flex'; newNameInput.focus(); newNameInput.select(); }
    function executeRename() {
        if (!currentRenameInfo) return;
        var newName = newNameInput.value.trim();
        var uniqueId = currentRenameInfo.uniqueId, category = currentRenameInfo.category, oldName = currentRenameInfo.oldName;
        if (!newName || newName === oldName) { renameModal.style.display = 'none'; currentRenameInfo = null; return; }
        renameModal.style.display = 'none';
        showSpinner();
        var libraryPath = window.localStorage.getItem('ae_asset_stash_path');
        csInterface.evalScript('renameStashedComp("' + libraryPath.replace(/\\/g, '\\\\') + '", "' + category + '", "' + uniqueId + '", "' + newName.replace(/"/g, '\\"') + '")', function (result) {
            if (result === "Success") {
                showToast("Comp renamed successfully.", false);
                loadLibrary(libraryPath);
            } else {
                showToast(result, true);
                hideSpinner();
            }
            currentRenameInfo = null;
        });
    }
    function promptDelete(uniqueId, category, name) { currentDeleteInfo = { uniqueId: uniqueId, category: category }; compToDeleteName.textContent = name; deleteModal.style.display = 'flex'; }
    function executeDelete() {
        if (!currentDeleteInfo) return;
        deleteModal.style.display = 'none';
        showSpinner();
        var libraryPath = window.localStorage.getItem('ae_asset_stash_path');
        var uniqueId = currentDeleteInfo.uniqueId, category = currentDeleteInfo.category;
        csInterface.evalScript('deleteStashedComp("' + libraryPath.replace(/\\/g, '\\\\') + '", "' + category + '", "' + uniqueId + '")', function (result) {
            if (result === "Success") {
                showToast("Comp deleted successfully.", false);
                loadLibrary(libraryPath);
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