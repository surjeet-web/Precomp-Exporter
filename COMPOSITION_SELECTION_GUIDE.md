# CompBuddy - Composition Selection Guide

## 🎯 Issue: "Please select a composition in the project panel"

This error occurs when trying to add a composition to your library but CompBuddy cannot find a selected composition.

## ✅ Solutions (Try in Order)

### Solution 1: Select Composition in Project Panel
1. **Open After Effects**
2. **In the Project Panel**, click on a composition to select it
3. **The composition should be highlighted in blue**
4. **In CompBuddy**, click "Add Selected Comp"

### Solution 2: Open Composition in Timeline
1. **Double-click a composition** in the Project Panel to open it
2. **The composition should appear in the Timeline**
3. **In CompBuddy**, click "Add Selected Comp"

### Solution 3: Create a New Composition First
1. **Go to Composition > New Composition** (or Ctrl+N / Cmd+N)
2. **Set your desired settings** and click OK
3. **The new composition will be automatically selected**
4. **In CompBuddy**, click "Add Selected Comp"

## 🔍 Troubleshooting Steps

### Step 1: Verify Composition Selection
Use the test file to check what's selected:
1. Open `test-composition.html` in the CompBuddy panel
2. Click "Test Composition Selection"
3. Check the output to see what After Effects detects

### Step 2: Check Project Panel
- Make sure you have at least one composition in your project
- The composition should be visible in the Project Panel
- Click on it to ensure it's selected (highlighted in blue)

### Step 3: Check Timeline
- If a composition is open in the Timeline, it should work automatically
- Make sure the Timeline tab is active (not just visible)

## 📋 Common Scenarios

### Scenario 1: Empty Project
**Problem**: No compositions exist in the project
**Solution**: Create a new composition first

### Scenario 2: Wrong Item Selected
**Problem**: You selected a footage item, folder, or other non-composition item
**Solution**: Select an actual composition (has a film strip icon)

### Scenario 3: Multiple Items Selected
**Problem**: Multiple items selected, but none are compositions
**Solution**: Select only one composition

### Scenario 4: Composition Not Active
**Problem**: Composition exists but isn't selected or active
**Solution**: Click on the composition or double-click to open it

## 🛠️ Technical Details

CompBuddy looks for compositions in this order:
1. **Active Item**: `app.project.activeItem` (composition open in timeline)
2. **Selected Items**: `app.project.selection` (items selected in project panel)

The script checks:
```javascript
// First check: Active composition in timeline
if (app.project.activeItem instanceof CompItem) {
    comp = app.project.activeItem;
}
// Second check: Selected composition in project panel
else if (app.project.selection.length > 0) {
    for (var i = 0; i < app.project.selection.length; i++) {
        if (app.project.selection[i] instanceof CompItem) {
            comp = app.project.selection[i];
            break;
        }
    }
}
```

## 🎥 Step-by-Step Video Guide

### Method 1: Project Panel Selection
1. Look at your Project Panel (usually on the left side)
2. Find a composition (looks like a film strip icon)
3. Click once on the composition name
4. The composition should highlight in blue
5. Go to CompBuddy and click "Add Selected Comp"

### Method 2: Timeline Method
1. Double-click any composition in the Project Panel
2. The composition opens in the Timeline (center panel)
3. Go to CompBuddy and click "Add Selected Comp"

## ⚠️ Important Notes

- **Only compositions work**: Footage, images, and folders cannot be added
- **One at a time**: Select only one composition at a time
- **Must be in current project**: Compositions from other projects won't work
- **Save your project**: It's recommended to save your project before adding to library

## 🔧 Advanced Troubleshooting

### If the error persists:

1. **Check After Effects Console**:
   - Go to Help > Scripting > Enable Scripting & Expressions
   - Look for any error messages

2. **Test with Simple Composition**:
   - Create a new composition (Composition > New Composition)
   - Don't add anything to it
   - Try adding it to CompBuddy

3. **Restart After Effects**:
   - Close After Effects completely
   - Reopen and try again

4. **Check Plugin Installation**:
   - Ensure all files are in the correct CEP extensions folder
   - Verify `jsx/hostscript.jsx` exists and is readable

## 📞 Still Having Issues?

If you're still getting the error after trying all solutions:

1. **Use the test file**: Open `test-composition.html` and run the tests
2. **Check the output**: Look for specific error messages
3. **Verify your setup**: Make sure you have compositions in your project
4. **Try the minimal test**: Use `minimal-test.html` to test basic functionality

## ✅ Success Indicators

You'll know it's working when:
- ✅ No error message appears
- ✅ You see "Success: Composition '[name]' added to library"
- ✅ The composition appears in your CompBuddy library
- ✅ You can search and filter the added composition

---

*This guide should resolve the composition selection issue. If you continue to have problems, the test files will help identify the specific cause.*