# CompBuddy Plugin - Complete Testing Guide

## 🎯 Testing Overview

This guide covers comprehensive testing of the CompBuddy After Effects plugin after removing the licensing system and implementing security fixes.

## 📋 Pre-Testing Setup

### 1. Installation
1. Copy the entire plugin folder to your CEP extensions directory:
   - **Windows**: `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\CompBuddy\`
   - **macOS**: `/Library/Application Support/Adobe/CEP/extensions/CompBuddy/`

2. Enable CEP debugging (if needed):
   - **Windows**: Registry `HKEY_CURRENT_USER\Software\Adobe\CSXS.11` → Set `PlayerDebugMode = 1`
   - **macOS**: Terminal `defaults write com.adobe.CSXS.11 PlayerDebugMode 1`

3. Restart After Effects

### 2. Required Files Checklist
- ✅ `index.html` - Main UI
- ✅ `js/main.js` - Frontend logic (security-fixed)
- ✅ `js/CSInterface.js` - CEP interface
- ✅ `jsx/hostscript.jsx` - Backend functions
- ✅ `CSXS/manifest.xml` - Extension manifest
- ✅ `CSS/style.css` - Styles
- ✅ `img/logo.png` - Logo

## 🧪 Functional Testing

### Test 1: Plugin Loading
**Objective**: Verify plugin loads without license screen

**Steps**:
1. Open After Effects
2. Go to `Window > Extensions > CompBuddy`
3. Plugin should open immediately

**Expected Result**: ✅ Main interface appears directly (no license activation screen)
**Status**: [ ] PASS [ ] FAIL

### Test 2: Library Setup
**Objective**: Test library folder selection

**Steps**:
1. Click "Browse..." button
2. Select a folder for your composition library
3. Path should display in the interface

**Expected Result**: ✅ Folder path appears in the interface
**Status**: [ ] PASS [ ] FAIL

### Test 3: Add Composition
**Objective**: Test adding compositions to library

**Steps**:
1. Create a simple composition in After Effects
2. Select the composition in the project panel
3. Click "Add Selected Comp" in the plugin
4. Choose or create a category (e.g., "Test")
5. Confirm addition

**Expected Result**: ✅ Composition added to library with success message
**Status**: [ ] PASS [ ] FAIL

### Test 4: Search and Filter
**Objective**: Test search and category filtering

**Steps**:
1. Add multiple compositions with different categories
2. Use the search box to find specific compositions
3. Click category filter buttons
4. Test "All" category

**Expected Result**: ✅ Compositions filter correctly by search and category
**Status**: [ ] PASS [ ] FAIL

### Test 5: Import Composition
**Objective**: Test importing compositions back to project

**Steps**:
1. Click the "Import" button on any composition in the library
2. Check After Effects project panel

**Expected Result**: ✅ Composition imported into current project
**Status**: [ ] PASS [ ] FAIL

### Test 6: Rename Composition
**Objective**: Test renaming compositions in library

**Steps**:
1. Click the rename button (pencil icon) on a composition
2. Enter a new name
3. Confirm rename

**Expected Result**: ✅ Composition renamed successfully
**Status**: [ ] PASS [ ] FAIL

### Test 7: Delete Composition
**Objective**: Test deleting compositions from library

**Steps**:
1. Click the delete button (trash icon) on a composition
2. Confirm deletion in the modal

**Expected Result**: ✅ Composition removed from library
**Status**: [ ] PASS [ ] FAIL

## 🔒 Security Testing

### Test 8: XSS Prevention
**Objective**: Verify XSS vulnerabilities are fixed

**Steps**:
1. Open `test-security.html` in a browser
2. Run all security tests
3. Check that all XSS tests pass

**Expected Result**: ✅ All XSS prevention tests pass
**Status**: [ ] PASS [ ] FAIL

### Test 9: Path Traversal Prevention
**Objective**: Verify path traversal attacks are blocked

**Steps**:
1. Try to create categories with path traversal characters (`../`)
2. Test file paths with dangerous characters
3. Verify sanitization works

**Expected Result**: ✅ Dangerous paths are sanitized
**Status**: [ ] PASS [ ] FAIL

### Test 10: Input Validation
**Objective**: Test input validation and limits

**Steps**:
1. Try to create very long category names (>50 chars)
2. Try special characters in category names
3. Test empty/null inputs

**Expected Result**: ✅ Invalid inputs are rejected with appropriate messages
**Status**: [ ] PASS [ ] FAIL

## 🌐 Network and Offline Testing

### Test 11: Offline Functionality
**Objective**: Verify plugin works without internet

**Steps**:
1. Disconnect from internet
2. Open CompBuddy
3. Test all core functionality

**Expected Result**: ✅ Plugin works normally without network errors
**Status**: [ ] PASS [ ] FAIL

### Test 12: No License Validation
**Objective**: Confirm no license-related network calls

**Steps**:
1. Monitor network traffic (if possible)
2. Use plugin for 5 minutes
3. Check for any Gumroad API calls

**Expected Result**: ✅ No license-related network requests
**Status**: [ ] PASS [ ] FAIL

## 🐛 Error Handling Testing

### Test 13: Invalid File Paths
**Objective**: Test error handling for invalid paths

**Steps**:
1. Manually edit localStorage to set invalid library path
2. Reload plugin
3. Try to perform operations

**Expected Result**: ✅ Graceful error handling with user-friendly messages
**Status**: [ ] PASS [ ] FAIL

### Test 14: Missing JSX Functions
**Objective**: Test behavior when JSX functions fail

**Steps**:
1. Temporarily rename `hostscript.jsx`
2. Try to use plugin functions
3. Check error messages

**Expected Result**: ✅ Clear error messages, no crashes
**Status**: [ ] PASS [ ] FAIL

### Test 15: Corrupted Metadata
**Objective**: Test handling of corrupted library data

**Steps**:
1. Create a library with compositions
2. Manually corrupt the `compbuddy_metadata.json` file
3. Try to load library

**Expected Result**: ✅ Plugin handles corruption gracefully
**Status**: [ ] PASS [ ] FAIL

## 🎨 UI/UX Testing

### Test 16: Responsive Design
**Objective**: Test UI at different panel sizes

**Steps**:
1. Resize the CompBuddy panel
2. Test minimum and maximum sizes
3. Check element positioning

**Expected Result**: ✅ UI adapts properly to different sizes
**Status**: [ ] PASS [ ] FAIL

### Test 17: Toast Notifications
**Objective**: Test user feedback system

**Steps**:
1. Perform various operations (add, rename, delete)
2. Check toast notifications appear
3. Verify success/error styling

**Expected Result**: ✅ Appropriate notifications for all actions
**Status**: [ ] PASS [ ] FAIL

### Test 18: Modal Dialogs
**Objective**: Test modal functionality

**Steps**:
1. Test all modal dialogs (add, rename, delete)
2. Try canceling operations
3. Test form validation in modals

**Expected Result**: ✅ All modals work correctly with proper validation
**Status**: [ ] PASS [ ] FAIL

## 🔧 Performance Testing

### Test 19: Large Library Performance
**Objective**: Test with many compositions

**Steps**:
1. Add 50+ compositions to library
2. Test search performance
3. Test category filtering speed
4. Check UI responsiveness

**Expected Result**: ✅ Plugin remains responsive with large libraries
**Status**: [ ] PASS [ ] FAIL

### Test 20: Memory Usage
**Objective**: Monitor memory consumption

**Steps**:
1. Use plugin for extended period
2. Add/remove many compositions
3. Check for memory leaks

**Expected Result**: ✅ Stable memory usage, no significant leaks
**Status**: [ ] PASS [ ] FAIL

## 📊 Test Results Summary

### Overall Status
- **Total Tests**: 20
- **Passed**: ___/20
- **Failed**: ___/20
- **Overall Status**: [ ] PASS [ ] FAIL

### Critical Issues Found
(List any critical issues that need immediate attention)

### Recommendations
(List any improvements or fixes needed)

### Security Status
- **XSS Prevention**: [ ] SECURE [ ] VULNERABLE
- **Path Traversal**: [ ] SECURE [ ] VULNERABLE  
- **Input Validation**: [ ] SECURE [ ] VULNERABLE
- **Overall Security**: [ ] SECURE [ ] VULNERABLE

## 🎯 Final Approval

**Plugin Ready for Production**: [ ] YES [ ] NO

**Tester Signature**: _________________ **Date**: _________

---

## 🛠️ Troubleshooting Common Issues

### Issue: Plugin doesn't appear in Extensions menu
**Solution**: 
- Check file permissions
- Verify CEP debugging is enabled
- Restart After Effects
- Check manifest.xml syntax

### Issue: EvalScript errors
**Solution**:
- Verify `hostscript.jsx` exists and has correct functions
- Check After Effects console for specific errors
- Ensure project is open when using plugin

### Issue: UI appears broken
**Solution**:
- Check browser console for JavaScript errors
- Verify all CSS and JS files are present
- Clear browser cache if using CEP debugging

### Issue: Functions don't work
**Solution**:
- Verify JSX script is loading correctly
- Check After Effects scripting preferences
- Test with simple composition first

---

*This testing guide ensures comprehensive validation of the CompBuddy plugin's functionality, security, and user experience.*