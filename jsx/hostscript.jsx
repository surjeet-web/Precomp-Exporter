// CompBuddy JSX Host Script
// This script runs in After Effects and provides the backend functionality

function selectLibraryFolder() {
    try {
        var folder = Folder.selectDialog("Select CompBuddy Library Folder");
        if (folder) {
            return folder.fsName;
        }
        return "";
    } catch (e) {
        return "Error: " + e.toString();
    }
}

function getStashedComps(libraryPath) {
    try {
        if (!libraryPath) return "[]";
        
        var libraryFolder = new Folder(libraryPath);
        if (!libraryFolder.exists) return "[]";
        
        var metadataFile = new File(libraryFolder.fsName + "/compbuddy_metadata.json");
        if (!metadataFile.exists) return "[]";
        
        metadataFile.open("r");
        var content = metadataFile.read();
        metadataFile.close();
        
        return content || "[]";
    } catch (e) {
        return "Error: " + e.toString();
    }
}

function stashSelectedComp(libraryPath, categoryName) {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            return "Error: Please select a composition in the project panel.";
        }
        
        var libraryFolder = new Folder(libraryPath);
        if (!libraryFolder.exists) {
            libraryFolder.create();
        }
        
        var categoryFolder = new Folder(libraryFolder.fsName + "/" + categoryName);
        if (!categoryFolder.exists) {
            categoryFolder.create();
        }
        
        // Generate unique ID
        var uniqueId = "comp_" + new Date().getTime() + "_" + Math.floor(Math.random() * 1000);
        
        // Save composition as AEP file
        var aepFile = new File(categoryFolder.fsName + "/" + uniqueId + ".aep");
        app.project.save(aepFile);
        
        // Create thumbnail (simplified - you might want to render a frame)
        var thumbPath = categoryFolder.fsName + "/" + uniqueId + "_thumb.png";
        
        // Update metadata
        var metadataFile = new File(libraryFolder.fsName + "/compbuddy_metadata.json");
        var metadata = [];
        
        if (metadataFile.exists) {
            metadataFile.open("r");
            var content = metadataFile.read();
            metadataFile.close();
            try {
                metadata = JSON.parse(content);
            } catch (e) {
                metadata = [];
            }
        }
        
        metadata.push({
            uniqueId: uniqueId,
            name: comp.name,
            category: categoryName,
            aepPath: aepFile.fsName,
            thumbPath: thumbPath,
            dateAdded: new Date().toISOString()
        });
        
        metadataFile.open("w");
        metadataFile.write(JSON.stringify(metadata, null, 2));
        metadataFile.close();
        
        return "Success: Composition '" + comp.name + "' added to library.";
    } catch (e) {
        return "Error: " + e.toString();
    }
}

function importComp(aepPath) {
    try {
        var aepFile = new File(aepPath);
        if (!aepFile.exists) {
            return "Error: Composition file not found.";
        }
        
        var importOptions = new ImportOptions(aepFile);
        var importedItem = app.project.importFile(importOptions);
        
        return "Success: Composition imported successfully.";
    } catch (e) {
        return "Error: " + e.toString();
    }
}

function renameStashedComp(libraryPath, category, uniqueId, newName) {
    try {
        var metadataFile = new File(libraryPath + "/compbuddy_metadata.json");
        if (!metadataFile.exists) {
            return "Error: Metadata file not found.";
        }
        
        metadataFile.open("r");
        var content = metadataFile.read();
        metadataFile.close();
        
        var metadata = JSON.parse(content);
        
        for (var i = 0; i < metadata.length; i++) {
            if (metadata[i].uniqueId === uniqueId && metadata[i].category === category) {
                metadata[i].name = newName;
                break;
            }
        }
        
        metadataFile.open("w");
        metadataFile.write(JSON.stringify(metadata, null, 2));
        metadataFile.close();
        
        return "Success";
    } catch (e) {
        return "Error: " + e.toString();
    }
}

function deleteStashedComp(libraryPath, category, uniqueId) {
    try {
        var metadataFile = new File(libraryPath + "/compbuddy_metadata.json");
        if (!metadataFile.exists) {
            return "Error: Metadata file not found.";
        }
        
        metadataFile.open("r");
        var content = metadataFile.read();
        metadataFile.close();
        
        var metadata = JSON.parse(content);
        var compToDelete = null;
        
        for (var i = 0; i < metadata.length; i++) {
            if (metadata[i].uniqueId === uniqueId && metadata[i].category === category) {
                compToDelete = metadata[i];
                metadata.splice(i, 1);
                break;
            }
        }
        
        if (compToDelete) {
            // Delete files
            var aepFile = new File(compToDelete.aepPath);
            if (aepFile.exists) aepFile.remove();
            
            var thumbFile = new File(compToDelete.thumbPath);
            if (thumbFile.exists) thumbFile.remove();
        }
        
        metadataFile.open("w");
        metadataFile.write(JSON.stringify(metadata, null, 2));
        metadataFile.close();
        
        return "Success";
    } catch (e) {
        return "Error: " + e.toString();
    }
}